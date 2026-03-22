"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskStatus } from "@prisma/client";

interface RecentTask {
  id: string;
  status: TaskStatus;
  originalContent: string;
  projectId: string;
  project: { id: string; title: string };
  assignedTo?: { name: string } | null;
  updatedAt: string;
}

export function RecentTasks({ tasks }: { tasks: RecentTask[] }) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-stone-900">Recent Tasks</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 mb-3">
              <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm text-stone-500">No tasks yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-stone-900">Recent Tasks</h3>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[22%]" />
              <col className="w-[20%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-stone-100 text-left">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Content</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Project</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-stone-50 last:border-0 hover:bg-warm-gray/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/dashboard/projects/${task.projectId}/tasks/${task.id}`}
                      className="text-sm font-medium text-stone-800 hover:text-amber-700 transition-colors line-clamp-1 break-all"
                    >
                      {task.originalContent.substring(0, 60)}
                      {task.originalContent.length > 60 ? "..." : ""}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-stone-500 truncate">
                    {task.project.title}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-stone-500 truncate">
                    {task.assignedTo?.name || <span className="text-stone-300">Unassigned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y divide-stone-100">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/dashboard/projects/${task.projectId}/tasks/${task.id}`}
              className="flex flex-col gap-2 px-5 py-4 hover:bg-warm-gray/50 transition-colors"
            >
              <p className="text-sm font-medium text-stone-800 line-clamp-1">
                {task.originalContent.substring(0, 80)}
              </p>
              <div className="flex items-center gap-2 flex-wrap text-xs text-stone-400">
                <span>{task.project.title}</span>
                <span className="text-stone-200">/</span>
                <StatusBadge status={task.status} />
                <span className="text-stone-200">/</span>
                <span>{task.assignedTo?.name || "Unassigned"}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
