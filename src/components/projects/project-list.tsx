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
      <div className="flex flex-col items-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 mb-4">
          <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-stone-600">No projects yet</p>
        <p className="text-xs text-stone-400 mt-1">Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {projects.map((project, index) => (
        <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
          <Card className="hover:shadow-md hover:border-stone-300/80 transition-all duration-200 cursor-pointer animate-fade-up" style={{ animationDelay: `${index * 0.04}s` }}>
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-stone-900">{project.title}</h3>
                {project.description && (
                  <p className="text-sm text-stone-500 mt-1 line-clamp-1">{project.description}</p>
                )}
                <div className="flex items-center gap-2.5 mt-2.5">
                  <Badge>
                    {project.sourceLang} → {project.targetLang}
                  </Badge>
                  <span className="text-xs text-stone-400">
                    by {project.createdBy.name}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-stone-900 tabular-nums">{project._count.tasks}</p>
                <p className="text-[11px] text-stone-400 uppercase tracking-wider font-medium">tasks</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
