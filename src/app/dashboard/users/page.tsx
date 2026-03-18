"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { UserList } from "@/components/users/user-list";
import { UserForm } from "@/components/users/user-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const { data: session, status: sessionStatus } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchUsers() {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  if (sessionStatus === "loading") return null;
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-stone-900">User Management</h1>
        <p className="text-sm text-stone-400 mt-0.5">Create and manage team members</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-stone-900">Create New User</h2>
        </CardHeader>
        <CardContent>
          <UserForm onCreated={fetchUsers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-stone-900">All Users</h2>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <UserList users={users} onUpdate={fetchUsers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
