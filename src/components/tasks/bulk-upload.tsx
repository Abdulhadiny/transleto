"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface User {
  id: string;
  name: string;
  role: string;
}

type ParseMode = "line" | "csv";

function parseContent(text: string, mode: ParseMode): string[] {
  if (mode === "csv") {
    const lines = text.split("\n").filter((l) => l.trim());
    const start =
      lines.length > 0 && /^["']?(content|text|original)/i.test(lines[0])
        ? 1
        : 0;
    return lines
      .slice(start)
      .map((line) => {
        const match = line.match(/^"([^"]*)"/) || line.match(/^([^,]*)/);
        return match ? match[1].trim() : line.trim();
      })
      .filter(Boolean);
  }
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
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
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingData = useRef<FormData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users?pageSize=100")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.data)) setUsers(data.data);
      })
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

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (preview.length === 0) {
      setError("No tasks to upload. Select a file first.");
      return;
    }
    pendingData.current = new FormData(e.currentTarget);
    setShowConfirm(true);
  }

  async function handleConfirmedUpload() {
    setShowConfirm(false);
    const formData = pendingData.current;
    if (!formData) return;
    setLoading(true);
    setError("");
    setSuccess("");

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
    <form onSubmit={handleUpload} className="space-y-5">
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200/60 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 shrink-0 text-rose-400 hover:text-rose-600">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200/60 px-4 py-3 text-sm text-teal-700">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1.5">
          Upload File (.txt or .csv)
        </label>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer">
            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Choose file
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          {preview.length > 0 && (
            <span className="text-sm text-stone-500">
              {preview.length} tasks detected
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-stone-400">
          .txt: one task per line &middot; .csv: first column used as content
        </p>
      </div>

      {preview.length > 0 && (
        <div>
          <p className="text-sm font-medium text-stone-600 mb-1.5">
            Preview ({preview.length} tasks) — {mode === "csv" ? "CSV" : "line-by-line"} mode
          </p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50">
            <ul className="divide-y divide-stone-200/60">
              {preview.map((item, i) => (
                <li key={i} className="px-4 py-2.5 text-sm text-stone-700">
                  <span className="text-stone-400 tabular-nums mr-2">{i + 1}.</span>
                  {item.length > 120 ? item.substring(0, 120) + "..." : item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <>
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

          <Button type="submit" disabled={loading}>
            {loading ? "Uploading..." : `Upload ${preview.length} Tasks`}
          </Button>
        </>
      )}
      <ConfirmModal
        open={showConfirm}
        title="Upload Tasks"
        message={`Are you sure you want to upload ${preview.length} tasks?`}
        confirmLabel="Upload"
        onConfirm={handleConfirmedUpload}
        onCancel={() => setShowConfirm(false)}
      />
    </form>
  );
}
