import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { reviewTaskSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { upsertTranslationMemory } from "@/lib/translation-memory";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const user = session!.user;
  if (user.role !== "REVIEWER") {
    return NextResponse.json({ error: "Only reviewers can review" }, { status: 403 });
  }

  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.reviewedById && task.reviewedById !== user.id) {
    return NextResponse.json({ error: "You are not assigned to review this task" }, { status: 403 });
  }

  if (task.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Task is not submitted for review" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = reviewTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { status, reviewNote, translatedContent } = parsed.data;

  if (status === "REJECTED" && !reviewNote) {
    return NextResponse.json({ error: "Review note required for rejection" }, { status: 400 });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: status === "REJECTED" ? "REJECTED" : "APPROVED",
      reviewedById: user.id,
      reviewNote: reviewNote || null,
      ...(translatedContent !== undefined && { translatedContent }),
    },
  });

  await logActivity({
    action: status === "APPROVED" ? "TASK_APPROVED" : "TASK_REJECTED",
    userId: user.id,
    detail: status === "APPROVED"
      ? "Approved translation"
      : `Rejected translation: ${reviewNote}`,
    projectId: task.projectId,
    taskId: id,
  });

  const project = await prisma.project.findUnique({
    where: { id: task.projectId },
    select: { title: true, sourceLang: true, targetLang: true },
  });

  if (task.assignedToId) {
    const contentPreview = `${task.originalContent.slice(0, 50)}${task.originalContent.length > 50 ? "..." : ""}`;
    await createNotification({
      type: status === "APPROVED" ? "TASK_APPROVED" : "TASK_REJECTED",
      userId: task.assignedToId,
      message: status === "APPROVED"
        ? `Your translation of "${contentPreview}" in "${project?.title}" was approved`
        : `Your translation of "${contentPreview}" in "${project?.title}" was rejected: ${reviewNote}`,
      actorId: user.id,
      taskId: id,
      projectId: task.projectId,
    });
  }

  // Fire-and-forget TM upsert on approval
  if (status === "APPROVED" && (translatedContent || task.translatedContent) && project) {
    upsertTranslationMemory({
      sourceText: task.originalContent,
      targetText: (translatedContent || task.translatedContent)!,
      sourceLang: project.sourceLang,
      targetLang: project.targetLang,
      projectId: task.projectId,
      taskId: id,
    }).catch((err) => console.error("Failed to upsert TM entry:", err));
  }

  return NextResponse.json(updated);
}
