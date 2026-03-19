"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { BulkUpload } from "@/components/tasks/bulk-upload";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

interface Project {
  id: string;
  title: string;
  description?: string | null;
  sourceLang: string;
  targetLang: string;
  createdBy: { name: string };
  tasks: Array<{
    id: string;
    originalContent: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REJECTED";
    dueDate?: string | null;
    assignedTo: { id: string; name: string } | null;
    reviewedBy: { id: string; name: string } | null;
  }>;
}

export default function ProjectDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportStatus, setExportStatus] = useState("APPROVED");
  const [exporting, setExporting] = useState(false);
  const [taskPage, setTaskPage] = useState(1);
  const [taskTotal, setTaskTotal] = useState(0);
  const taskPageSize = 20;

  const fetchProject = useCallback((page = taskPage) => {
    const qp = new URLSearchParams();
    if (statusFilter) qp.set("status", statusFilter);
    if (searchFilter) qp.set("search", searchFilter);
    qp.set("page", String(page));
    qp.set("pageSize", String(taskPageSize));

    fetch(`/api/projects/${projectId}?${qp.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setProject(data);
        if (data.taskPagination) {
          setTaskTotal(data.taskPagination.total);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId, statusFilter, searchFilter, taskPage]);

  useEffect(() => {
    setTaskPage(1);
  }, [statusFilter, searchFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchProject, 300);
    return () => clearTimeout(timeout);
  }, [fetchProject]);

  if (loading && !project) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!project || !project.createdBy) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="text-stone-500">Project not found.</p>
      </div>
    );
  }

  const isAdmin = session?.user?.role === "ADMIN";

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/export?format=${exportFormat}&status=${exportStatus}`
      );
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `export.${exportFormat}`;

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
    <div className="space-y-6">
      {/* Project header */}
      <div className="animate-fade-up">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-3 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-stone-900">{project.title}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-stone-500">{project.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <Badge>{project.sourceLang} → {project.targetLang}</Badge>
          <span className="text-xs text-stone-400">
            Created by {project.createdBy?.name ?? "Unknown"}
          </span>
        </div>
      </div>

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-stone-900">Add Task</h2>
            </CardHeader>
            <CardContent>
              <TaskForm projectId={projectId} onCreated={() => { setTaskPage(1); fetchProject(1); }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-stone-900">Bulk Upload Tasks</h2>
            </CardHeader>
            <CardContent>
              <BulkUpload projectId={projectId} onCreated={() => { setTaskPage(1); fetchProject(1); }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-stone-900">Export Translations</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">Format</label>
                  <Select
                    options={[
                      { value: "csv", label: "CSV" },
                      { value: "json", label: "JSON" },
                    ]}
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1.5">Status Filter</label>
                  <Select
                    options={[
                      { value: "APPROVED", label: "Approved Only" },
                      { value: "ALL", label: "All Statuses" },
                      { value: "SUBMITTED", label: "Submitted" },
                      { value: "IN_PROGRESS", label: "In Progress" },
                    ]}
                    value={exportStatus}
                    onChange={(e) => setExportStatus(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button onClick={handleExport} disabled={exporting} variant="secondary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {exporting ? "Exporting..." : "Download"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Tasks section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-sm font-semibold text-stone-900">
              Tasks ({taskTotal})
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search tasks..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="sm:w-48"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sm:w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TaskList tasks={project.tasks ?? []} projectId={projectId} />
          <Pagination page={taskPage} pageSize={taskPageSize} total={taskTotal} onPageChange={setTaskPage} />
        </CardContent>
      </Card>
    </div>
  );
}
