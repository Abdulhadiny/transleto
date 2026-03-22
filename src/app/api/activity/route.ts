import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const user = session!.user;
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15")));
  const action = searchParams.get("action");
  const filterUserId = searchParams.get("userId");

  const where = {
    ...(user.role !== "ADMIN" && { userId: user.id }),
    ...(user.role === "ADMIN" && filterUserId && { userId: filterUserId }),
    ...(action && { action: action as never }),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, role: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
