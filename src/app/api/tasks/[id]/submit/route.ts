import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { submitTaskSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const user = session!.user;
  if (user.role !== "TRANSLATOR") {
    return NextResponse.json({ error: "Only translators can submit" }, { status: 403 });
  }

  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.assignedToId !== user.id) {
    return NextResponse.json({ error: "Not assigned to you" }, { status: 403 });
  }

  if (task.status !== "IN_PROGRESS" && task.status !== "NOT_STARTED") {
    return NextResponse.json({ error: "Task cannot be submitted in current status" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = submitTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      translatedContent: parsed.data.translatedContent,
      status: "SUBMITTED",
    },
  });

  await logActivity({
    action: "TASK_SUBMITTED",
    userId: user.id,
    detail: "Submitted translation for review",
    projectId: task.projectId,
    taskId: id,
  });

  return NextResponse.json(updated);
}
