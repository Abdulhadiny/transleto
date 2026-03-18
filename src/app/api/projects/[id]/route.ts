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

  const taskWhere: Record<string, unknown> = {};
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

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      tasks: {
        where: Object.keys(taskWhere).length > 0 ? taskWhere : undefined,
        include: {
          assignedTo: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
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
