"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskStatus } from "@prisma/client";

interface RecentTask {
  id: string;
  status: TaskStatus;
  originalContent: string;
  project: { title: string };
  assignedTo?: { name: string } | null;
  updatedAt: string;
}

export function RecentTasks({ tasks }: { tasks: RecentTask[] }) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Tasks</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No tasks yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Recent Tasks</h3>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-6 py-3 font-medium">Content</th>
              <th className="px-6 py-3 font-medium">Project</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link
                    href={`/dashboard/projects/${task.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {task.originalContent.substring(0, 60)}
                    {task.originalContent.length > 60 ? "..." : ""}
                  </Link>
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {task.project.title}
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-6 py-3 text-sm text-gray-600">
                  {task.assignedTo?.name || "Unassigned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
