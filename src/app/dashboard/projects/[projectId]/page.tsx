"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { BulkUpload } from "@/components/tasks/bulk-upload";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportStatus, setExportStatus] = useState("APPROVED");
  const [exporting, setExporting] = useState(false);

  const fetchProject = useCallback(() => {
    const qp = new URLSearchParams();
    if (statusFilter) qp.set("status", statusFilter);
    if (searchFilter) qp.set("search", searchFilter);
    const qs = qp.toString();

    fetch(`/api/projects/${projectId}${qs ? `?${qs}` : ""}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId, statusFilter, searchFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchProject, 300);
    return () => clearTimeout(timeout);
  }, [fetchProject]);

  if (loading && !project) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!project || !project.createdBy) {
    return <p className="text-gray-500">Project not found.</p>;
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
      // silent fail — could add toast later
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.title}</h1>
        {project.description && (
          <p className="mt-1 text-gray-500">{project.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge>{project.sourceLang} → {project.targetLang}</Badge>
          <span className="text-sm text-gray-400">
            Created by {project.createdBy?.name ?? "Unknown"}
          </span>
        </div>
      </div>

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Add Task</h2>
            </CardHeader>
            <CardContent>
              <TaskForm projectId={projectId} onCreated={fetchProject} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Bulk Upload Tasks</h2>
            </CardHeader>
            <CardContent>
              <BulkUpload projectId={projectId} onCreated={fetchProject} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Export Translations</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
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
                <Button onClick={handleExport} disabled={exporting}>
                  {exporting ? "Exporting..." : "Download"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Tasks ({project.tasks?.length ?? 0})
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
        </CardContent>
      </Card>
    </div>
  );
}
