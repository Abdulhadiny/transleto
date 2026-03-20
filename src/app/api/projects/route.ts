import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized, requireRole } from "@/lib/auth-helpers";
import { createProjectSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function GET(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const user = session!.user;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const lang = searchParams.get("lang") || "";

  const where: Record<string, unknown> = {};

  // Translators only see projects where they have assigned tasks
  if (user.role === "TRANSLATOR") {
    where.tasks = { some: { assignedToId: user.id } };
  }
  // Reviewers only see projects where they have tasks to review
  if (user.role === "REVIEWER") {
    where.tasks = { some: { reviewedById: user.id } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (lang) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
    ];
    // Filter by source or target language
    where.AND = [
      ...(search ? [{ OR: where.OR }] : []),
      { OR: [{ sourceLang: lang }, { targetLang: lang }] },
    ];
    if (search) delete where.OR;
  }

  const projects = await prisma.project.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      createdById: session!.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logActivity({
    action: "PROJECT_CREATED",
    userId: session!.user.id,
    detail: `Created project "${parsed.data.title}"`,
    projectId: project.id,
  });

  return NextResponse.json(project, { status: 201 });
}
