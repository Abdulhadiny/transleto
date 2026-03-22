"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
  user: { name: string; role: string };
}

interface UserOption {
  id: string;
  name: string;
}

const actionConfig: Record<string, { color: string; label: string }> = {
  PROJECT_CREATED: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "Project Created" },
  TASK_CREATED: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "Task Created" },
  TASK_ASSIGNED: { color: "bg-stone-100 text-stone-600 border-stone-200", label: "Task Assigned" },
  TASK_SAVED: { color: "bg-stone-100 text-stone-500 border-stone-200", label: "Task Saved" },
  TASK_SUBMITTED: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Task Submitted" },
  TASK_APPROVED: { color: "bg-teal-100 text-teal-700 border-teal-200", label: "Task Approved" },
  TASK_REJECTED: { color: "bg-rose-100 text-rose-700 border-rose-200", label: "Task Rejected" },
  USER_CREATED: { color: "bg-sky-100 text-sky-700 border-sky-200", label: "User Created" },
  USER_ROLE_CHANGED: { color: "bg-violet-100 text-violet-700 border-violet-200", label: "Role Changed" },
  USER_PASSWORD_CHANGED: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Password Changed" },
  USER_ACTIVATED: { color: "bg-teal-100 text-teal-700 border-teal-200", label: "User Activated" },
  USER_DEACTIVATED: { color: "bg-rose-100 text-rose-700 border-rose-200", label: "User Deactivated" },
  PASSWORD_SELF_CHANGED: { color: "bg-amber-50 text-amber-600 border-amber-200", label: "Password Changed" },
};

const ACTIONS = Object.keys(actionConfig);
const PER_PAGE = 30;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);

  if (sessionStatus === "authenticated" && session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  useEffect(() => {
    fetch("/api/users?pageSize=100")
      .then((res) => res.json())
      .then((res) => {
        const list = Array.isArray(res) ? res : res.data;
        if (Array.isArray(list)) {
          setUsers(list.map((u: { id: string; name: string }) => ({ id: u.id, name: u.name })));
        }
      })
      .catch(() => {});
  }, []);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PER_PAGE),
    });
    if (actionFilter) params.set("action", actionFilter);
    if (userFilter) params.set("userId", userFilter);

    fetch(`/api/activity?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [page, actionFilter, userFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const startEntry = (page - 1) * PER_PAGE + 1;
  const endEntry = Math.min(page * PER_PAGE, total);

  if (sessionStatus === "loading") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Audit Log</h1>
        <p className="text-sm text-stone-500 mt-1">
          Complete history of all system activity
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-sm font-semibold text-stone-900">
              {total} {total === 1 ? "entry" : "entries"}
            </h2>
            <div className="flex flex-wrap gap-2">
              <select
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                <option value="">All users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                <option value="">All actions</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {actionConfig[a]?.label || a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 mb-3">
                <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-stone-500">No activity found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">User</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Action</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {logs.map((log) => {
                    const config = actionConfig[log.action] ?? {
                      color: "bg-stone-100 text-stone-500 border-stone-200",
                      label: log.action,
                    };
                    return (
                      <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-xs text-stone-400">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div>
                            <p className="font-medium text-stone-800">{log.user.name}</p>
                            <p className="text-[11px] text-stone-400 capitalize">{log.user.role.toLowerCase()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-stone-600 max-w-md truncate">
                          {log.detail}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
              <p className="text-xs text-stone-400">
                Showing {startEntry}–{endEntry} of {total}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  {generatePageNumbers(page, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="px-1.5 text-xs text-stone-300">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`h-8 min-w-[2rem] rounded-md text-xs font-medium transition-colors ${
                          p === page
                            ? "bg-stone-900 text-white"
                            : "text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                  >
                    Last
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}
