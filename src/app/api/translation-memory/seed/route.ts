import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { upsertTranslationMemory } from "@/lib/translation-memory";

export async function POST() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const tasks = await prisma.task.findMany({
    where: {
      status: "APPROVED",
      translatedContent: { not: null },
    },
    include: {
      project: { select: { sourceLang: true, targetLang: true } },
    },
  });

  let seeded = 0;
  let skipped = 0;

  for (const task of tasks) {
    if (!task.translatedContent || !task.project) {
      skipped++;
      continue;
    }

    try {
      await upsertTranslationMemory({
        sourceText: task.originalContent,
        targetText: task.translatedContent,
        sourceLang: task.project.sourceLang,
        targetLang: task.project.targetLang,
        projectId: task.projectId,
        taskId: task.id,
      });
      seeded++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ seeded, skipped, total: tasks.length });
}
