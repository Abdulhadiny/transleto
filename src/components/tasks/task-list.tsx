"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskStatus } from "@prisma/client";

interface Task {
  id: string;
  originalContent: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignedTo?: { id: string; name: string } | null;
  reviewedBy?: { id: string; name: string } | null;
}

function formatDueDate(dateStr?: string | null, status?: TaskStatus) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const isOverdue = due < new Date() && status !== "APPROVED";
  const label = due.toLocaleDateString();
  return { label, isOverdue };
}

export function TaskList({ tasks, projectId }: { tasks: Task[]; projectId: string }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 mb-3">
          <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
        <p className="text-sm font-medium text-stone-600">No tasks yet</p>
        <p className="text-xs text-stone-400 mt-1">Add a task above to get started.</p>
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
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Content</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Status</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Translator</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Reviewer</th>
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-stone-50 last:border-0 hover:bg-warm-gray/50 transition-colors">
                <td className="px-6 py-3.5">
                  <Link
                    href={`/dashboard/projects/${projectId}/tasks/${task.id}`}
                    className="font-medium text-stone-800 hover:text-amber-700 transition-colors"
                  >
                    {task.originalContent.substring(0, 80)}
                    {task.originalContent.length > 80 ? "..." : ""}
                  </Link>
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-6 py-3.5 text-stone-500">
                  {task.assignedTo?.name || <span className="text-stone-300">Unassigned</span>}
                </td>
                <td className="px-6 py-3.5 text-stone-500">
                  {task.reviewedBy?.name || <span className="text-stone-300">Unassigned</span>}
                </td>
                <td className="px-6 py-3.5 text-stone-500">
                  {(() => {
                    const due = formatDueDate(task.dueDate, task.status);
                    if (!due) return <span className="text-stone-300">—</span>;
                    return (
                      <span className={due.isOverdue ? "text-rose-600 font-medium" : ""}>
                        {due.label}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-stone-100">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/dashboard/projects/${projectId}/tasks/${task.id}`}
            className="flex flex-col gap-2 px-5 py-4 hover:bg-warm-gray/50 transition-colors"
          >
            <p className="text-sm font-medium text-stone-800 line-clamp-2">
              {task.originalContent.substring(0, 100)}
              {task.originalContent.length > 100 ? "..." : ""}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status} />
              <span className="text-xs text-stone-400">
                {task.assignedTo?.name || "Unassigned"}
              </span>
              {(() => {
                const due = formatDueDate(task.dueDate, task.status);
                if (!due) return null;
                return (
                  <span className={`text-xs ${due.isOverdue ? "text-rose-600 font-medium" : "text-stone-400"}`}>
                    Due: {due.label}
                  </span>
                );
              })()}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
