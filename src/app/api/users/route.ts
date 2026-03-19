import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const skip = (page - 1) * pageSize;

  const select = {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      select,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}
