import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";

function getISOWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(monday: Date): string {
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function GET() {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const user = session!.user;

  // Reviewers don't see this data
  if (user.role === "REVIEWER") {
    return NextResponse.json({ weeks: [], translators: [] });
  }

  const since = new Date();
  since.setDate(since.getDate() - 28);
  since.setHours(0, 0, 0, 0);

  // Fetch relevant activity logs
  const logs = await prisma.activityLog.findMany({
    where: {
      action: { in: ["TASK_SUBMITTED", "TASK_APPROVED", "TASK_REJECTED"] },
      createdAt: { gte: since },
    },
    select: {
      action: true,
      userId: true,
      taskId: true,
      createdAt: true,
    },
  });

  // For APPROVED/REJECTED, we need to resolve the translator (assignedToId) from the task
  const reviewTaskIds = [
    ...new Set(
      logs
        .filter((l) => l.action !== "TASK_SUBMITTED" && l.taskId)
        .map((l) => l.taskId!)
    ),
  ];

  const tasks =
    reviewTaskIds.length > 0
      ? await prisma.task.findMany({
          where: { id: { in: reviewTaskIds } },
          select: { id: true, assignedToId: true },
        })
      : [];

  const taskAssigneeMap = new Map(
    tasks.map((t) => [t.id, t.assignedToId])
  );

  // Build 4 week buckets (Monday-based)
  const weekMondays: Date[] = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weekMondays.push(getISOWeekMonday(d));
  }

  const weekLabels = weekMondays.map(formatWeekLabel);

  // Aggregate by translator + week
  // Key: `${translatorId}:${weekIndex}`
  const agg = new Map<
    string,
    { submissions: number; approved: number; rejected: number }
  >();

  function getWeekIndex(date: Date): number {
    const monday = getISOWeekMonday(date);
    const mondayTime = monday.getTime();
    for (let i = 0; i < weekMondays.length; i++) {
      if (mondayTime === weekMondays[i].getTime()) return i;
    }
    return -1;
  }

  const translatorIds = new Set<string>();

  for (const log of logs) {
    const weekIdx = getWeekIndex(new Date(log.createdAt));
    if (weekIdx === -1) continue;

    let translatorId: string | null = null;

    if (log.action === "TASK_SUBMITTED") {
      translatorId = log.userId;
    } else {
      // APPROVED/REJECTED — the translator is the task's assignee
      translatorId = log.taskId ? (taskAssigneeMap.get(log.taskId) ?? null) : null;
    }

    if (!translatorId) continue;

    // TRANSLATOR role: only include own data
    if (user.role === "TRANSLATOR" && translatorId !== user.id) continue;

    translatorIds.add(translatorId);
    const key = `${translatorId}:${weekIdx}`;

    if (!agg.has(key)) {
      agg.set(key, { submissions: 0, approved: 0, rejected: 0 });
    }
    const entry = agg.get(key)!;

    if (log.action === "TASK_SUBMITTED") entry.submissions++;
    else if (log.action === "TASK_APPROVED") entry.approved++;
    else if (log.action === "TASK_REJECTED") entry.rejected++;
  }

  // Fetch translator names
  const translatorUsers =
    translatorIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...translatorIds] } },
          select: { id: true, name: true },
        })
      : [];

  const nameMap = new Map(translatorUsers.map((u) => [u.id, u.name]));

  // Build response
  const translators = [...translatorIds].map((id) => ({
    id,
    name: nameMap.get(id) || "Unknown",
    weeks: weekMondays.map((_, weekIdx) => {
      const entry = agg.get(`${id}:${weekIdx}`);
      const submissions = entry?.submissions ?? 0;
      const approved = entry?.approved ?? 0;
      const rejected = entry?.rejected ?? 0;
      const reviewed = approved + rejected;
      return {
        submissions,
        approved,
        rejected,
        approvalRate: reviewed > 0 ? Math.round((approved / reviewed) * 100) : null,
      };
    }),
  }));

  // Sort by name
  translators.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ weeks: weekLabels, translators });
}
