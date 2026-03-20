import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { createGlossarySchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.glossaryEntry.findMany({
      orderBy: { english: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.glossaryEntry.count(),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(request: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await request.json();
  const parsed = createGlossarySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const entry = await prisma.glossaryEntry.create({
    data: {
      english: parsed.data.english,
      hausa: parsed.data.hausa,
      reviewed: parsed.data.reviewed ?? "",
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
