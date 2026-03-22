"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { UserActionsMenu } from "./user-actions-menu";
import { AdminChangePasswordModal } from "./admin-change-password-modal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "TRANSLATOR", label: "Translator" },
  { value: "REVIEWER", label: "Reviewer" },
];

const roleBadgeVariant: Record<string, "info" | "success" | "warning"> = {
  ADMIN: "info",
  TRANSLATOR: "success",
  REVIEWER: "warning",
};

export function UserList({
  users,
  onUpdate,
}: {
  users: User[];
  onUpdate: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const pendingAction = useRef<(() => Promise<void>) | null>(null);

  function showConfirm(message: string, action: () => Promise<void>) {
    setConfirmMessage(message);
    pendingAction.current = action;
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setConfirmOpen(false);
    await pendingAction.current?.();
  }

  function handleRoleChange(userId: string) {
    showConfirm("Are you sure you want to change this user's role?", async () => {
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      setEditingId(null);
      onUpdate();
    });
  }

  function handleToggleActive(user: User) {
    const action = user.isActive ? "deactivate" : "activate";
    showConfirm(`Are you sure you want to ${action} this user?`, async () => {
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      onUpdate();
    });
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 mb-3">
          <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <p className="text-sm text-stone-500">No users found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left">
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Name</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Email</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Role</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Status</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={`border-b border-stone-50 last:border-0 hover:bg-warm-gray/50 transition-colors ${
                  !user.isActive ? "opacity-50" : ""
                }`}
              >
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-bold text-stone-500">
                      {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <span className="font-medium text-stone-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-stone-500">{user.email}</td>
                <td className="px-6 py-3.5">
                  {editingId === user.id ? (
                    <Select
                      options={roleOptions}
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                    />
                  ) : (
                    <Badge variant={roleBadgeVariant[user.role] || "default"}>
                      {user.role}
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${user.isActive ? "bg-teal-400" : "bg-stone-300"}`} />
                    <span className={`text-xs ${user.isActive ? "text-teal-700" : "text-stone-400"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  {editingId === user.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleRoleChange(user.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <UserActionsMenu
                      user={user}
                      onChangeRole={(u) => {
                        setEditingId(u.id);
                        setEditRole(u.role);
                      }}
                      onChangePassword={(u) => setPasswordUser(u)}
                      onToggleActive={handleToggleActive}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-stone-100">
        {users.map((user) => (
          <div key={user.id} className={`px-5 py-4 space-y-3 ${!user.isActive ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-bold text-stone-500">
                  {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-900">{user.name}</p>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-teal-400" : "bg-stone-300"}`} />
                  </div>
                  <p className="text-xs text-stone-400">{user.email}</p>
                </div>
              </div>
              {editingId === user.id ? (
                <Select
                  options={roleOptions}
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-32"
                />
              ) : (
                <Badge variant={roleBadgeVariant[user.role] || "default"}>
                  {user.role}
                </Badge>
              )}
            </div>
            <div className="flex justify-end">
              {editingId === user.id ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRoleChange(user.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <UserActionsMenu
                  user={user}
                  onChangeRole={(u) => {
                    setEditingId(u.id);
                    setEditRole(u.role);
                  }}
                  onChangePassword={(u) => setPasswordUser(u)}
                  onToggleActive={handleToggleActive}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Admin password reset modal */}
      {passwordUser && (
        <AdminChangePasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onSuccess={onUpdate}
        />
      )}
      <ConfirmModal
        open={confirmOpen}
        title="Confirm Action"
        message={confirmMessage}
        confirmLabel="Confirm"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
