import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word")?.trim();

  if (!word) {
    return NextResponse.json({ error: "Word is required" }, { status: 400 });
  }

  const entry = await prisma.glossaryEntry.findFirst({
    where: { english: { equals: word, mode: "insensitive" } },
    select: { english: true, hausa: true },
  });

  if (!entry) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({ found: true, english: entry.english, hausa: entry.hausa });
}
