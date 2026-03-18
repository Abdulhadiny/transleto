"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { Skeleton } from "@/components/ui/skeleton";

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

  const fetchProject = useCallback(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-gray-500">Project not found.</p>;
  }

  const isAdmin = session?.user?.role === "ADMIN";

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
            Created by {project.createdBy.name}
          </span>
        </div>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Add Task</h2>
          </CardHeader>
          <CardContent>
            <TaskForm projectId={projectId} onCreated={fetchProject} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Tasks ({project.tasks.length})
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          <TaskList tasks={project.tasks} projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
