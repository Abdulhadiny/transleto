import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized, requireRole } from "@/lib/auth-helpers";
import { updateProjectSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      tasks: {
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
