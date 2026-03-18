import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const bulkTaskSchema = z.object({
  tasks: z.array(z.string().min(1)).min(1, "At least one task is required"),
  assignedToId: z.string().optional(),
  reviewedById: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = bulkTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { tasks: contents, assignedToId, reviewedById, dueDate } = parsed.data;

  const created = await prisma.task.createMany({
    data: contents.map((content) => ({
      projectId,
      originalContent: content,
      assignedToId: assignedToId || null,
      reviewedById: reviewedById || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    })),
  });

  await logActivity({
    action: "TASK_CREATED",
    userId: session!.user.id,
    detail: `Bulk created ${created.count} tasks in "${project.title}"`,
    projectId,
  });

  return NextResponse.json({ count: created.count }, { status: 201 });
}
