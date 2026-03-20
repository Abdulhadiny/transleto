import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { translateText } from "@/lib/google-translate";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    select: { originalContent: true, assignedToId: true, reviewedById: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const user = session!.user;
  const hasAccess =
    user.role === "ADMIN" ||
    task.assignedToId === user.id ||
    task.reviewedById === user.id;

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Attempt translation
  try {
    const suggestion = await translateText(task.originalContent);
    return NextResponse.json({ suggestion });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
