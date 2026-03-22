import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;

  const existing = await prisma.glossaryEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  if (existing.status === "approved") {
    return NextResponse.json({ error: "Entry is already approved" }, { status: 400 });
  }

  const entry = await prisma.glossaryEntry.update({
    where: { id },
    data: { status: "approved" },
  });

  return NextResponse.json(entry);
}
