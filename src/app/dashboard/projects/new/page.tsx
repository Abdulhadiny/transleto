"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Project</h1>
      <ProjectForm />
    </div>
  );
}
