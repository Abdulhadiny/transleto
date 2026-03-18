"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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

  async function handleRoleChange(userId: string) {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editRole }),
    });
    setEditingId(null);
    onUpdate();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{user.name}</td>
              <td className="px-4 py-3 text-gray-600">{user.email}</td>
              <td className="px-4 py-3">
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
              <td className="px-4 py-3">
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(user.id);
                      setEditRole(user.role);
                    }}
                  >
                    Edit Role
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
