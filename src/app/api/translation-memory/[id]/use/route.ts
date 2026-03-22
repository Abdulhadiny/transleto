import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { incrementTMUsage } from "@/lib/translation-memory";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;

  await incrementTMUsage(id);

  return NextResponse.json({ success: true });
}
