import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { createTaskSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

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
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      originalContent: parsed.data.originalContent,
      assignedToId: parsed.data.assignedToId,
      reviewedById: parsed.data.reviewedById,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  const logs = [
    logActivity({
      action: "TASK_CREATED",
      userId: session!.user.id,
      detail: `Created task in "${project.title}"`,
      projectId,
      taskId: task.id,
    }),
  ];
  if (parsed.data.assignedToId) {
    logs.push(
      logActivity({
        action: "TASK_ASSIGNED",
        userId: session!.user.id,
        detail: `Assigned task to ${task.assignedTo?.name ?? "translator"}`,
        projectId,
        taskId: task.id,
      })
    );
  }
  await Promise.all(logs);

  return NextResponse.json(task, { status: 201 });
}
