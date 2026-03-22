"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TranslationEditor } from "@/components/tasks/translation-editor";
import { ReviewPanel } from "@/components/tasks/review-panel";
import { TaskAssign } from "@/components/tasks/task-assign";
import { CommentThread } from "@/components/tasks/comment-thread";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskStatus } from "@prisma/client";

interface Task {
  id: string;
  originalContent: string;
  translatedContent?: string | null;
  status: TaskStatus;
  reviewNote?: string | null;
  dueDate?: string | null;
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
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="text-stone-500">Task not found or access denied.</p>
      </div>
    );
  }

  const role = session?.user?.role;

  async function handleExport(format: string) {
    setExporting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `task_translation.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-600 transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {task.project.title}
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold text-stone-900">Task Detail</h1>
          <StatusBadge status={task.status} />
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-stone-500">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>Translator: {task.assignedTo?.name || <span className="text-stone-300">Unassigned</span>}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Reviewer: {task.reviewedBy?.name || <span className="text-stone-300">Unassigned</span>}</span>
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span
                className={
                  new Date(task.dueDate) < new Date() && task.status !== "APPROVED"
                    ? "text-rose-600 font-medium"
                    : ""
                }
              >
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Assignment (admin only) */}
      {role === "ADMIN" && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-stone-900">Assignment</h2>
          </CardHeader>
          <CardContent>
            <TaskAssign
              taskId={task.id}
              currentTranslatorId={task.assignedTo?.id}
              currentReviewerId={task.reviewedBy?.id}
              currentDueDate={task.dueDate}
              onUpdate={fetchTask}
            />
          </CardContent>
        </Card>
      )}

      {/* Translation / Review / Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">
              {role === "TRANSLATOR" ? "Translation" : role === "REVIEWER" ? "Review" : "Overview"}
            </h2>
            <div className="relative" ref={exportRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExportMenuOpen((v) => !v)}
                disabled={exporting}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {exporting ? "Exporting..." : "Export"}
              </Button>
              {exportMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-stone-200/80 bg-white shadow-lg overflow-hidden z-10 animate-fade-up">
                  {[
                    { value: "csv", label: "CSV" },
                    { value: "json", label: "JSON" },
                    { value: "docx", label: "DOCX" },
                  ].map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => {
                        setExportMenuOpen(false);
                        handleExport(fmt.value);
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors cursor-pointer"
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
              reviewNote={task.reviewNote}
              onUpdate={fetchTask}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">
                  Original Content
                </label>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm min-h-[160px] whitespace-pre-wrap text-stone-700 leading-relaxed">
                  {task.originalContent}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1.5">
                  Translation
                </label>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm min-h-[160px] whitespace-pre-wrap text-stone-700 leading-relaxed">
                  {task.translatedContent || "No translation yet."}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discussion */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-stone-900">Discussion</h2>
        </CardHeader>
        <CardContent>
          <CommentThread taskId={task.id} />
        </CardContent>
      </Card>
    </div>
  );
}
