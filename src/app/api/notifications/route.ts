import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";

export async function GET() {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const userId = session!.user.id;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        actor: { select: { id: true, name: true } },
      },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
