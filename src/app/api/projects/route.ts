import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized, requireRole } from "@/lib/auth-helpers";
import { createProjectSchema } from "@/lib/validations";

export async function GET() {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const projects = await prisma.project.findMany({
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

  return NextResponse.json(project, { status: 201 });
}
