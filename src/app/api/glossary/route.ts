import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { createGlossarySchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const skip = (page - 1) * pageSize;
  const statusFilter = searchParams.get("status");

  const isAdmin = session!.user.role === "ADMIN";

  // Build where clause: non-admins only see approved entries
  const where: Record<string, string> = {};
  if (statusFilter && (statusFilter === "approved" || statusFilter === "proposed")) {
    where.status = statusFilter;
  } else if (!isAdmin) {
    where.status = "approved";
  }

  const [data, total] = await Promise.all([
    prisma.glossaryEntry.findMany({
      where,
      orderBy: { english: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.glossaryEntry.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(request: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await request.json();
  const parsed = createGlossarySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const isAdmin = session!.user.role === "ADMIN";

  const entry = await prisma.glossaryEntry.create({
    data: {
      english: parsed.data.english,
      hausa: parsed.data.hausa,
      reviewed: parsed.data.reviewed ?? "",
      definition: parsed.data.definition,
      partOfSpeech: parsed.data.partOfSpeech,
      usageExample: parsed.data.usageExample,
      domain: parsed.data.domain,
      forbiddenTerms: parsed.data.forbiddenTerms ?? [],
      notes: parsed.data.notes,
      status: isAdmin ? (parsed.data.status ?? "approved") : "proposed",
      proposedById: isAdmin ? undefined : session!.user.id,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
