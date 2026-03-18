"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
  user: { name: string; role: string };
}

const actionBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  PROJECT_CREATED: { label: "Project", variant: "info" },
  TASK_CREATED: { label: "Task", variant: "info" },
  TASK_ASSIGNED: { label: "Assigned", variant: "default" },
  TASK_SAVED: { label: "Draft", variant: "default" },
  TASK_SUBMITTED: { label: "Submitted", variant: "warning" },
  TASK_APPROVED: { label: "Approved", variant: "success" },
  TASK_REJECTED: { label: "Rejected", variant: "danger" },
  USER_CREATED: { label: "User", variant: "info" },
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
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => {
              const badge = actionBadge[log.action] ?? { label: log.action, variant: "default" as const };
              return (
                <li key={log.id} className="flex items-start gap-3 text-sm">
                  <Badge variant={badge.variant} className="mt-0.5 shrink-0">
                    {badge.label}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800">
                      <span className="font-medium">{log.user.name}</span>{" "}
                      {log.detail}
                    </p>
                    <p className="text-xs text-gray-400">{timeAgo(log.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
