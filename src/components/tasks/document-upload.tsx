"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { type DocumentSegment, parseDocx, parseHtml } from "@/lib/document-parser";

interface User {
  id: string;
  name: string;
  role: string;
}

const SEGMENT_BADGES: Record<string, { label: string; className: string }> = {
  heading1: { label: "H1", className: "bg-violet-100 text-violet-700" },
  heading2: { label: "H2", className: "bg-blue-100 text-blue-700" },
  heading3: { label: "H3", className: "bg-sky-100 text-sky-700" },
  heading4: { label: "H4", className: "bg-teal-100 text-teal-700" },
  heading5: { label: "H5", className: "bg-emerald-100 text-emerald-700" },
  heading6: { label: "H6", className: "bg-green-100 text-green-700" },
  paragraph: { label: "P", className: "bg-stone-100 text-stone-600" },
};

export function DocumentUpload({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [segments, setSegments] = useState<DocumentSegment[]>([]);
  const [fileName, setFileName] = useState("");
  const [sourceFormat, setSourceFormat] = useState<"docx" | "html">("docx");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setFileName(file.name);
    setParsing(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let parsed: DocumentSegment[];

      if (ext === "docx") {
        setSourceFormat("docx");
        const buffer = await file.arrayBuffer();
        parsed = await parseDocx(buffer);
      } else if (ext === "html" || ext === "htm") {
        setSourceFormat("html");
        const text = await file.text();
        parsed = parseHtml(text);
      } else {
        setError("Unsupported file format. Please upload .docx, .html, or .htm");
        setParsing(false);
        return;
      }

      if (parsed.length === 0) {
        setError("No content segments found in the document");
        setSegments([]);
      } else {
        setSegments(parsed);
      }
    } catch {
      setError("Failed to parse document. Please check the file format.");
      setSegments([]);
    } finally {
      setParsing(false);
    }
  }

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (segments.length === 0) {
      setError("No segments to upload. Select a file first.");
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

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments,
          sourceFormat,
          sourceFileName: fileName,
          assignedToId: formData.get("assignedToId") || undefined,
          reviewedById: formData.get("reviewedById") || undefined,
          dueDate: formData.get("dueDate") || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to upload document");
        return;
      }

      const data = await res.json();
      setSuccess(`Successfully created ${data.count} tasks from "${fileName}"`);
      setSegments([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      onCreated();
    } catch {
      setError("Failed to upload document");
    } finally {
      setLoading(false);
    }
  }

  const translators = users.filter((u) => u.role === "TRANSLATOR");
  const reviewers = users.filter((u) => u.role === "REVIEWER");

  return (
    <form onSubmit={handleUpload} className="space-y-5">
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200/60 px-4 py-3 text-sm text-rose-700">
          {error}
          <button type="button" onClick={() => setError("")} className="ml-2 shrink-0 text-rose-400 hover:text-rose-600">
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
          Upload Document (.docx, .html, or .htm)
        </label>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer">
            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Choose document
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.html,.htm"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          {parsing && (
            <span className="text-sm text-stone-500">Parsing document...</span>
          )}
          {!parsing && segments.length > 0 && (
            <span className="text-sm text-stone-500">
              {segments.length} segments from {fileName}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-stone-400">
          Paragraphs and headings are extracted as individual translation tasks
        </p>
      </div>

      {segments.length > 0 && (
        <div>
          <p className="text-sm font-medium text-stone-600 mb-1.5">
            Preview ({segments.length} segments) — {sourceFormat.toUpperCase()} format
          </p>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50">
            <ul className="divide-y divide-stone-200/60">
              {segments.map((seg) => {
                const badge = SEGMENT_BADGES[seg.segmentType] || SEGMENT_BADGES.paragraph;
                return (
                  <li key={seg.orderIndex} className="px-4 py-2.5 text-sm text-stone-700 flex items-start gap-2.5">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold shrink-0 mt-0.5 ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span>
                      {seg.content.length > 150 ? seg.content.substring(0, 150) + "..." : seg.content}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {segments.length > 0 && (
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

          <Button type="submit" disabled={loading || parsing}>
            {loading ? "Uploading..." : `Upload ${segments.length} Segments`}
          </Button>
        </>
      )}
      <ConfirmModal
        open={showConfirm}
        title="Upload Document"
        message={`Are you sure you want to upload ${segments.length} segments from "${fileName}"?`}
        confirmLabel="Upload"
        onConfirm={handleConfirmedUpload}
        onCancel={() => setShowConfirm(false)}
      />
    </form>
  );
}
