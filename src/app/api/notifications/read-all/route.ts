import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";

export async function PATCH() {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  await prisma.notification.updateMany({
    where: { userId: session!.user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
