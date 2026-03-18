"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const languageOptions = [
  { value: "EN", label: "English" },
  { value: "HA", label: "Hausa" },
];

export function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description") || undefined,
        sourceLang: formData.get("sourceLang"),
        targetLang: formData.get("targetLang"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create project");
      setLoading(false);
      return;
    }

    const project = await res.json();
    router.push(`/dashboard/projects/${project.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <Input id="title" name="title" label="Project Title" required />

      <Textarea id="description" name="description" label="Description (optional)" />

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="sourceLang"
          name="sourceLang"
          label="Source Language"
          options={languageOptions}
          defaultValue="EN"
        />
        <Select
          id="targetLang"
          name="targetLang"
          label="Target Language"
          options={languageOptions}
          defaultValue="HA"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Project"}
      </Button>
    </form>
  );
}
