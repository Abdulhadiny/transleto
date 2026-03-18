"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  title: string;
  description?: string | null;
  sourceLang: string;
  targetLang: string;
  createdBy: { name: string };
  _count: { tasks: number };
  createdAt: string;
}

export function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="text-4xl text-gray-300 mb-3">&#128218;</div>
        <p className="text-sm font-medium text-gray-500">No projects yet</p>
        <p className="text-xs text-gray-400 mt-1">Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">{project.title}</h3>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge>{project.sourceLang} → {project.targetLang}</Badge>
                  <span className="text-xs text-gray-400">
                    by {project.createdBy.name}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{project._count.tasks}</p>
                <p className="text-xs text-gray-500">tasks</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
