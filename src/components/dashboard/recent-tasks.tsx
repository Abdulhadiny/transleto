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
          <h3 className="text-lg font-semibold">Recent Tasks</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="text-3xl text-gray-300 mb-2">&#128203;</div>
            <p className="text-sm text-gray-500">No tasks yet.</p>
          </div>
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
        {/* Desktop table */}
        <div className="hidden md:block">
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
                <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <Link
                      href={`/dashboard/projects/${task.projectId}`}
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
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y divide-gray-100">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/dashboard/projects/${task.projectId}`}
              className="flex flex-col gap-1.5 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm text-blue-600 font-medium line-clamp-1">
                {task.originalContent.substring(0, 80)}
              </p>
              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                <span>{task.project.title}</span>
                <span>&#183;</span>
                <StatusBadge status={task.status} />
                <span>&#183;</span>
                <span>{task.assignedTo?.name || "Unassigned"}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
