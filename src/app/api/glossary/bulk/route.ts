import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { bulkGlossarySchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await request.json();
  const parsed = bulkGlossarySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const result = await prisma.glossaryEntry.createMany({
    data: parsed.data.entries.map((entry) => ({
      english: entry.english,
      hausa: entry.hausa,
      reviewed: entry.reviewed ?? "",
    })),
  });

  return NextResponse.json({ count: result.count }, { status: 201 });
}
