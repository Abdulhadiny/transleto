import { prisma } from "@/lib/prisma";
import { Language } from "@prisma/client";

interface UpsertTMParams {
  sourceText: string;
  targetText: string;
  sourceLang: Language;
  targetLang: Language;
  projectId?: string;
  taskId?: string;
}

export interface TMMatch {
  id: string;
  sourceText: string;
  targetText: string;
  similarity: number;
  usageCount: number;
  updatedAt: Date;
}

export async function upsertTranslationMemory({
  sourceText,
  targetText,
  sourceLang,
  targetLang,
  projectId,
  taskId,
}: UpsertTMParams) {
  return prisma.translationMemory.upsert({
    where: {
      sourceText_sourceLang_targetLang: {
        sourceText,
        sourceLang,
        targetLang,
      },
    },
    update: {
      targetText,
      projectId,
      taskId,
    },
    create: {
      sourceText,
      targetText,
      sourceLang,
      targetLang,
      projectId,
      taskId,
    },
  });
}

export async function searchTranslationMemory(
  queryText: string,
  sourceLang: Language,
  targetLang: Language,
  threshold = 0.3,
  limit = 10
): Promise<TMMatch[]> {
  const results = await prisma.$queryRawUnsafe<TMMatch[]>(
    `SELECT id, "sourceText", "targetText",
      similarity("sourceText", $1) AS similarity,
      "usageCount", "updatedAt"
    FROM "TranslationMemory"
    WHERE "sourceLang" = $2::"Language"
      AND "targetLang" = $3::"Language"
      AND similarity("sourceText", $1) >= $4
    ORDER BY similarity DESC
    LIMIT $5`,
    queryText,
    sourceLang,
    targetLang,
    threshold,
    limit
  );

  return results;
}

export async function incrementTMUsage(tmId: string) {
  return prisma.translationMemory.update({
    where: { id: tmId },
    data: { usageCount: { increment: 1 } },
  });
}
