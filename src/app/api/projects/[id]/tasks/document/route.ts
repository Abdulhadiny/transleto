import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";
import { documentUploadSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = documentUploadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { segments, sourceFormat, sourceFileName, assignedToId, reviewedById, dueDate } = parsed.data;

  await prisma.project.update({
    where: { id: projectId },
    data: { sourceFormat, sourceFileName },
  });

  const created = await prisma.task.createMany({
    data: segments.map((seg) => ({
      projectId,
      originalContent: seg.content,
      orderIndex: seg.orderIndex,
      segmentType: seg.segmentType,
      assignedToId: assignedToId || null,
      reviewedById: reviewedById || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    })),
  });

  await logActivity({
    action: "TASK_CREATED",
    userId: session!.user.id,
    detail: `Uploaded ${sourceFormat.toUpperCase()} document "${sourceFileName}" with ${created.count} segments in "${project.title}"`,
    projectId,
  });

  if (assignedToId) {
    await createNotification({
      type: "TASK_ASSIGNED",
      userId: assignedToId,
      message: `You were assigned ${created.count} new task${created.count !== 1 ? "s" : ""} from document "${sourceFileName}" in project "${project.title}"`,
      actorId: session!.user.id,
      projectId,
    });
  }

  return NextResponse.json({ count: created.count }, { status: 201 });
}
