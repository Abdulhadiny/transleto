import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { searchTranslationMemory } from "@/lib/translation-memory";

export async function GET(request: Request) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const threshold = parseFloat(searchParams.get("threshold") || "0.3");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTranslationMemory(q, "EN", "HA", threshold);
    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("pg_trgm") || message.includes("similarity")) {
      return NextResponse.json({
        results: [],
        warning: "Translation memory search is not available (pg_trgm extension missing)",
      });
    }
    throw err;
  }
}
