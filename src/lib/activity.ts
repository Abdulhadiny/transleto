import { prisma } from "@/lib/prisma";
import { ActivityAction } from "@prisma/client";

export async function logActivity({
  action,
  userId,
  detail,
  projectId,
  taskId,
}: {
  action: ActivityAction;
  userId: string;
  detail: string;
  projectId?: string;
  taskId?: string;
}) {
  await prisma.activityLog.create({
    data: { action, userId, detail, projectId, taskId },
  });
}
