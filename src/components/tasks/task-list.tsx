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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl text-gray-300 mb-3">&#9998;</div>
        <p className="text-sm font-medium text-gray-500">No tasks yet</p>
        <p className="text-xs text-gray-400 mt-1">Add a task above to get started.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Content</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Translator</th>
              <th className="px-4 py-3 font-medium">Reviewer</th>
              <th className="px-4 py-3 font-medium">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/projects/${projectId}/tasks/${task.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {task.originalContent.substring(0, 80)}
                    {task.originalContent.length > 80 ? "..." : ""}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {task.assignedTo?.name || "Unassigned"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {task.reviewedBy?.name || "Unassigned"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {(() => {
                    const due = formatDueDate(task.dueDate, task.status);
                    if (!due) return "—";
                    return (
                      <span className={due.isOverdue ? "text-red-600 font-medium" : ""}>
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
      <div className="sm:hidden divide-y divide-gray-100">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/dashboard/projects/${projectId}/tasks/${task.id}`}
            className="flex flex-col gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm text-blue-600 font-medium line-clamp-2">
              {task.originalContent.substring(0, 100)}
              {task.originalContent.length > 100 ? "..." : ""}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status} />
              <span className="text-xs text-gray-500">
                {task.assignedTo?.name || "Unassigned"}
              </span>
              {(() => {
                const due = formatDueDate(task.dueDate, task.status);
                if (!due) return null;
                return (
                  <span className={`text-xs ${due.isOverdue ? "text-red-600 font-medium" : "text-gray-400"}`}>
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
