import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { reviewTaskSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const user = session!.user;
  if (user.role !== "REVIEWER") {
    return NextResponse.json({ error: "Only reviewers can review" }, { status: 403 });
  }

  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (task.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Task is not submitted for review" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = reviewTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { status, reviewNote } = parsed.data;

  if (status === "REJECTED" && !reviewNote) {
    return NextResponse.json({ error: "Review note required for rejection" }, { status: 400 });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status,
      reviewedById: user.id,
      reviewNote: reviewNote || null,
    },
  });

  return NextResponse.json(updated);
}
