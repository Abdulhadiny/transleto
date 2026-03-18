import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";

export async function GET() {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const user = session!.user;

  if (user.role === "ADMIN") {
    const [totalProjects, totalTasks, totalUsers, tasksByStatus] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.user.count(),
      prisma.task.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    const recentTasks = await prisma.task.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { id: true, title: true } },
        assignedTo: { select: { name: true } },
      },
    });

    return NextResponse.json({
      totalProjects,
      totalTasks,
      totalUsers,
      tasksByStatus: Object.fromEntries(
        tasksByStatus.map((t) => [t.status, t._count.status])
      ),
      recentTasks,
    });
  }

  if (user.role === "TRANSLATOR") {
    const [assignedTasks, tasksByStatus] = await Promise.all([
      prisma.task.count({ where: { assignedToId: user.id } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { assignedToId: user.id },
        _count: { status: true },
      }),
    ]);

    const recentTasks = await prisma.task.findMany({
      where: { assignedToId: user.id },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { id: true, title: true } },
        assignedTo: { select: { name: true } },
      },
    });

    return NextResponse.json({
      assignedTasks,
      tasksByStatus: Object.fromEntries(
        tasksByStatus.map((t) => [t.status, t._count.status])
      ),
      recentTasks,
    });
  }

  if (user.role === "REVIEWER") {
    const [submittedForReview, reviewedByMe] = await Promise.all([
      prisma.task.count({ where: { reviewedById: user.id, status: "SUBMITTED" } }),
      prisma.task.count({ where: { reviewedById: user.id, status: { in: ["APPROVED", "REJECTED"] } } }),
    ]);

    const recentTasks = await prisma.task.findMany({
      where: { reviewedById: user.id },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { id: true, title: true } },
        assignedTo: { select: { name: true } },
      },
    });

    return NextResponse.json({
      submittedForReview,
      reviewedByMe,
      recentTasks,
    });
  }

  return NextResponse.json({});
}
