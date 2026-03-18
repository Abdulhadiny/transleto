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
      <h1 className="text-2xl font-bold">User Management</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create New User</h2>
        </CardHeader>
        <CardContent>
          <UserForm onCreated={fetchUsers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">All Users</h2>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
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
