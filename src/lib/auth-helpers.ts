import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function getSessionOrUnauthorized() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: unauthorized() };
  }
  return { session, error: null };
}

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: unauthorized() };
  }
  if (!roles.includes(session.user.role)) {
    return { session: null, error: forbidden() };
  }
  return { session, error: null };
}
