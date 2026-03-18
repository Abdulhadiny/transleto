"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
  user: { name: string; role: string };
}

const actionConfig: Record<string, { color: string }> = {
  PROJECT_CREATED: { color: "bg-sky-400" },
  TASK_CREATED: { color: "bg-sky-400" },
  TASK_ASSIGNED: { color: "bg-stone-400" },
  TASK_SAVED: { color: "bg-stone-300" },
  TASK_SUBMITTED: { color: "bg-amber-400" },
  TASK_APPROVED: { color: "bg-teal-400" },
  TASK_REJECTED: { color: "bg-rose-400" },
  USER_CREATED: { color: "bg-sky-400" },
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-stone-900">Activity</h3>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full animate-shimmer" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded animate-shimmer" />
                  <div className="h-2.5 w-1/3 rounded animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 mb-3">
              <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-stone-500">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-0">
            {logs.map((log, index) => {
              const config = actionConfig[log.action] ?? { color: "bg-stone-300" };
              return (
                <div key={log.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {/* Timeline line */}
                  {index < logs.length - 1 && (
                    <div className="absolute left-[4.5px] top-4 bottom-0 w-px bg-stone-100" />
                  )}
                  {/* Dot */}
                  <div className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${config.color} ring-2 ring-white`} />
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-700 leading-snug">
                      <span className="font-medium text-stone-900">{log.user.name}</span>{" "}
                      {log.detail}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
