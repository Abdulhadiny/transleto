"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TranslationEditor } from "@/components/tasks/translation-editor";
import { ReviewPanel } from "@/components/tasks/review-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskStatus } from "@prisma/client";

interface Task {
  id: string;
  originalContent: string;
  translatedContent?: string | null;
  status: TaskStatus;
  reviewNote?: string | null;
  assignedTo?: { id: string; name: string } | null;
  reviewedBy?: { id: string; name: string } | null;
  project: { id: string; title: string };
}

export default function TaskDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const taskId = params.taskId as string;
  const projectId = params.projectId as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = useCallback(() => {
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        setTask(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!task) {
    return <p className="text-gray-500">Task not found or access denied.</p>;
  }

  const role = session?.user?.role;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Back to {task.project.title}
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold">Task Detail</h1>
          <StatusBadge status={task.status} />
        </div>
        <div className="flex gap-4 mt-2 text-sm text-gray-500">
          <span>Translator: {task.assignedTo?.name || "Unassigned"}</span>
          <span>Reviewer: {task.reviewedBy?.name || "Unassigned"}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            {role === "TRANSLATOR" ? "Translation" : role === "REVIEWER" ? "Review" : "Overview"}
          </h2>
        </CardHeader>
        <CardContent>
          {role === "TRANSLATOR" && task.assignedTo?.id === session?.user?.id ? (
            <TranslationEditor
              taskId={task.id}
              originalContent={task.originalContent}
              translatedContent={task.translatedContent}
              status={task.status}
              reviewNote={task.reviewNote}
              onUpdate={fetchTask}
            />
          ) : role === "REVIEWER" ? (
            <ReviewPanel
              taskId={task.id}
              originalContent={task.originalContent}
              translatedContent={task.translatedContent}
              status={task.status}
              onUpdate={fetchTask}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Content
                </label>
                <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm min-h-[120px] whitespace-pre-wrap">
                  {task.originalContent}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Translation
                </label>
                <div className="rounded-md border border-gray-300 bg-blue-50 p-3 text-sm min-h-[120px] whitespace-pre-wrap">
                  {task.translatedContent || "No translation yet."}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
