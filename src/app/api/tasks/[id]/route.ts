import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { updateTaskSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
      assignedTo: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const user = session!.user;
  const hasAccess =
    user.role === "ADMIN" ||
    (user.role === "REVIEWER" && task.reviewedById === user.id) ||
    (user.role === "TRANSLATOR" && task.assignedToId === user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const user = session!.user;

  // Admin can update any field
  if (user.role === "ADMIN") {
    const { dueDate, ...rest } = parsed.data;
    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...rest,
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    if (parsed.data.assignedToId !== undefined || parsed.data.reviewedById !== undefined) {
      await logActivity({
        action: "TASK_ASSIGNED",
        userId: user.id,
        detail: "Updated task assignment",
        projectId: task.projectId,
        taskId: id,
      });

      if (parsed.data.assignedToId && parsed.data.assignedToId !== task.assignedToId) {
        const project = await prisma.project.findUnique({ where: { id: task.projectId }, select: { title: true } });
        await createNotification({
          type: "TASK_ASSIGNED",
          userId: parsed.data.assignedToId,
          message: `You were assigned to task "${task.originalContent.slice(0, 50)}${task.originalContent.length > 50 ? "..." : ""}" in project "${project?.title}"`,
          actorId: user.id,
          taskId: id,
          projectId: task.projectId,
        });
      }
    }

    return NextResponse.json(updated);
  }

  // Translator can only update translatedContent and status
  if (user.role === "TRANSLATOR" && task.assignedToId === user.id) {
    const { translatedContent, status } = parsed.data;
    const updated = await prisma.task.update({
      where: { id },
      data: { translatedContent, status },
    });

    await logActivity({
      action: "TASK_SAVED",
      userId: user.id,
      detail: "Saved translation draft",
      projectId: task.projectId,
      taskId: id,
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
