import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";

export async function GET() {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const user = session!.user;

  const where =
    user.role === "ADMIN"
      ? {}
      : { userId: user.id };

  const logs = await prisma.activityLog.findMany({
    where,
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, role: true } },
    },
  });

  return NextResponse.json(logs);
}
