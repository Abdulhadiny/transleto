import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  type: NotificationType;
  userId: string;
  message: string;
  actorId?: string;
  taskId?: string;
  projectId?: string;
}

export async function createNotification({
  type,
  userId,
  message,
  actorId,
  taskId,
  projectId,
}: CreateNotificationParams) {
  // No self-notifications
  if (actorId && actorId === userId) return;

  await prisma.notification.create({
    data: { type, userId, message, actorId, taskId, projectId },
  });
}

export async function createNotifications(
  recipientIds: (string | null | undefined)[],
  params: Omit<CreateNotificationParams, "userId">
) {
  const unique = [...new Set(recipientIds.filter(Boolean))] as string[];
  const filtered = params.actorId
    ? unique.filter((id) => id !== params.actorId)
    : unique;

  if (filtered.length === 0) return;

  await prisma.notification.createMany({
    data: filtered.map((userId) => ({
      type: params.type,
      userId,
      message: params.message,
      actorId: params.actorId,
      taskId: params.taskId,
      projectId: params.projectId,
    })),
  });
}
