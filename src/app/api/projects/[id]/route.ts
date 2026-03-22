import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized, requireRole } from "@/lib/auth-helpers";
import { updateProjectSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;
  const user = session!.user;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const assignedTo = searchParams.get("assignedTo") || "";
  const search = searchParams.get("search") || "";
  const taskPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const taskPageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const skip = (taskPage - 1) * taskPageSize;

  const taskWhere: Record<string, unknown> = { projectId: id };
  if (status) taskWhere.status = status;
  if (assignedTo) taskWhere.assignedToId = assignedTo;
  if (search) {
    taskWhere.originalContent = { contains: search, mode: "insensitive" };
  }

  // Translators only see tasks assigned to them
  if (user.role === "TRANSLATOR") {
    taskWhere.assignedToId = user.id;
  }
  // Reviewers only see tasks assigned to them for review
  if (user.role === "REVIEWER") {
    taskWhere.reviewedById = user.id;
  }

  const [project, tasks, taskTotal] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.task.findMany({
      where: taskWhere,
      include: {
        assignedTo: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: [
        { orderIndex: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      skip,
      take: taskPageSize,
    }),
    prisma.task.count({ where: taskWhere }),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Translators/reviewers can only access projects where they have tasks
  if (user.role === "TRANSLATOR" || user.role === "REVIEWER") {
    const hasTask = await prisma.task.findFirst({
      where: {
        projectId: id,
        ...(user.role === "TRANSLATOR"
          ? { assignedToId: user.id }
          : { reviewedById: user.id }),
      },
      select: { id: true },
    });
    if (!hasTask) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({
    ...project,
    tasks,
    taskPagination: { total: taskTotal, page: taskPage, pageSize: taskPageSize },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(project);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
