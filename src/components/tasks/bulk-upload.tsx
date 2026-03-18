"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface User {
  id: string;
  name: string;
  role: string;
}

type ParseMode = "line" | "csv";

function parseContent(text: string, mode: ParseMode): string[] {
  if (mode === "csv") {
    const lines = text.split("\n").filter((l) => l.trim());
    // Skip header row if it looks like one
    const start = lines.length > 0 && /^["']?(content|text|original)/i.test(lines[0]) ? 1 : 0;
    return lines.slice(start).map((line) => {
      // Take the first column, handle quoted values
      const match = line.match(/^"([^"]*)"/) || line.match(/^([^,]*)/);
      return match ? match[1].trim() : line.trim();
    }).filter(Boolean);
  }
  // Line mode: each non-empty line is a task
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function BulkUpload({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [mode, setMode] = useState<ParseMode>("line");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {});
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    const detectedMode: ParseMode = file.name.endsWith(".csv") ? "csv" : "line";
    setMode(detectedMode);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const items = parseContent(text, detectedMode);
      if (items.length === 0) {
        setError("No content found in file");
        setPreview([]);
        return;
      }
      setPreview(items);
    };
    reader.readAsText(file);
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (preview.length === 0) {
      setError("No tasks to upload. Select a file first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch(`/api/projects/${projectId}/tasks/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: preview,
        assignedToId: formData.get("assignedToId") || undefined,
        reviewedById: formData.get("reviewedById") || undefined,
        dueDate: formData.get("dueDate") || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to upload tasks");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setSuccess(`Successfully created ${data.count} tasks`);
    setPreview([]);
    if (fileRef.current) fileRef.current.value = "";
    setLoading(false);
    onCreated();
  }

  const translators = users.filter((u) => u.role === "TRANSLATOR");
  const reviewers = users.filter((u) => u.role === "REVIEWER");

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload File (.txt or .csv)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-1 text-xs text-gray-400">
          .txt: one task per line &middot; .csv: first column used as content
        </p>
      </div>

      {preview.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Preview ({preview.length} tasks) — {mode === "csv" ? "CSV" : "line-by-line"} mode
          </p>
          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50">
            <ul className="divide-y divide-gray-200">
              {preview.map((item, i) => (
                <li key={i} className="px-3 py-2 text-sm text-gray-700">
                  <span className="text-gray-400 mr-2">{i + 1}.</span>
                  {item.length > 120 ? item.substring(0, 120) + "..." : item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          id="assignedToId"
          name="assignedToId"
          label="Assign All to Translator"
          options={[
            { value: "", label: "Unassigned" },
            ...translators.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <Select
          id="reviewedById"
          name="reviewedById"
          label="Assign All to Reviewer"
          options={[
            { value: "", label: "Unassigned" },
            ...reviewers.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <Input
          id="dueDate"
          name="dueDate"
          label="Due Date (All)"
          type="date"
        />
      </div>

      <Button type="submit" disabled={loading || preview.length === 0}>
        {loading ? "Uploading..." : `Upload ${preview.length} Tasks`}
      </Button>
    </form>
  );
}
