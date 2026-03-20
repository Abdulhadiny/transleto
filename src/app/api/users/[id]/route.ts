import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { updateUserSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { role, password, isActive, ...rest } = parsed.data;
  const adminId = session!.user.id;

  // Block admin from changing their own role
  if (role !== undefined && id === adminId) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  // Block admin from deactivating themselves
  if (isActive === false && id === adminId) {
    return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
  }

  // Build update data
  const updateData: Record<string, unknown> = { ...rest };
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (password) {
    updateData.hashedPassword = await bcrypt.hash(password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  // Log activity for each change type
  const activities: { action: string; detail: string }[] = [];
  if (role !== undefined) {
    activities.push({ action: "USER_ROLE_CHANGED", detail: `changed role to ${role} for ${user.name}` });
  }
  if (password) {
    activities.push({ action: "USER_PASSWORD_CHANGED", detail: `reset password for ${user.name}` });
  }
  if (isActive === true) {
    activities.push({ action: "USER_ACTIVATED", detail: `activated user ${user.name}` });
  }
  if (isActive === false) {
    activities.push({ action: "USER_DEACTIVATED", detail: `deactivated user ${user.name}` });
  }

  for (const activity of activities) {
    await prisma.activityLog.create({
      data: {
        action: activity.action as never,
        userId: adminId,
        detail: activity.detail,
      },
    });
  }

  return NextResponse.json(user);
}
