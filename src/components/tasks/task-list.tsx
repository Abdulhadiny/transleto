"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskStatus } from "@prisma/client";

interface Task {
  id: string;
  originalContent: string;
  status: TaskStatus;
  assignedTo?: { id: string; name: string } | null;
  reviewedBy?: { id: string; name: string } | null;
}

export function TaskList({ tasks, projectId }: { tasks: Task[]; projectId: string }) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">No tasks yet. Add one to get started.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="px-4 py-3 font-medium">Content</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Translator</th>
            <th className="px-4 py-3 font-medium">Reviewer</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
