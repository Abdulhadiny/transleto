"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface BulkEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ParseMode = "csv" | "unknown";

interface ParsedEntry {
  english: string;
  hausa: string;
  reviewed?: string;
  definition?: string;
  partOfSpeech?: string;
  usageExample?: string;
  domain?: string;
}

function normalizeText(text: string): string {
  return text
    // Strip BOM (Byte Order Mark)
    .replace(/^\uFEFF/, "")
    // Normalize Unicode whitespace (non-breaking space, en/em space, etc.) to regular space
    .replace(/[\u00A0\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, " ")
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Normalize smart quotes to regular quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function cleanValue(s: string): string {
  return s
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function parseFile(text: string, fileName: string): { entries: ParsedEntry[]; errors: number[] } {
  const normalized = normalizeText(text);
  const lines = normalized.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return { entries: [], errors: [] };

  // Detect and skip header row
  const start =
    lines.length > 0 && /^["']?(english|word|term|source)/i.test(lines[0])
      ? 1
      : 0;

  const entries: ParsedEntry[] = [];
  const errors: number[] = [];

  lines.slice(start).forEach((line, i) => {
    // Handle quoted CSV values
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        parts.push(cleanValue(current));
        current = "";
      } else {
        current += char;
      }
    }
    parts.push(cleanValue(current));

    if (parts.length < 2 || !parts[0] || !parts[1]) {
      errors.push(i + start + 1);
      return;
    }

    entries.push({
      english: parts[0],
      hausa: parts[1],
      ...(parts[2] ? { reviewed: parts[2] } : {}),
      ...(parts[3] ? { definition: parts[3] } : {}),
      ...(parts[4] ? { partOfSpeech: parts[4] } : {}),
      ...(parts[5] ? { usageExample: parts[5] } : {}),
      ...(parts[6] ? { domain: parts[6] } : {}),
    });
  });

  return { entries, errors };
}

export function BulkEntryModal({ open, onClose, onSuccess }: BulkEntryModalProps) {
  const [preview, setPreview] = useState<ParsedEntry[]>([]);
  const [parseErrors, setParseErrors] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { entries, errors } = parseFile(text, file.name);
      if (entries.length === 0) {
        setError("No valid entries found in file");
        setPreview([]);
        setParseErrors([]);
        return;
      }
      setPreview(entries);
      setParseErrors(errors);
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleUpload() {
    if (preview.length === 0) {
      setError("No entries to upload. Select a file first.");
      return;
    }
    setShowConfirm(true);
  }

  async function handleConfirmedUpload() {
    setShowConfirm(false);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/glossary/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: preview }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ? JSON.stringify(data.error) : "Failed to upload entries");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setSuccess(`Successfully created ${data.count} glossary entries`);
      setPreview([]);
      setParseErrors([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      setLoading(false);
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  function handleClose() {
    setPreview([]);
    setParseErrors([]);
    setError("");
    setSuccess("");
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-stone-900">Bulk Upload Glossary Entries</h2>
        <p className="mt-1 text-sm text-stone-500">
          Upload a CSV file with columns: <code className="rounded bg-stone-100 px-1 py-0.5 text-xs">english,hausa,reviewed,definition,partOfSpeech,usageExample,domain</code>{" "}
          (only english and hausa are required)
        </p>

        <div className="mt-4 space-y-4">
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
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer">
                <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Choose file
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              {fileName && (
                <span className="text-sm text-stone-500">{fileName}</span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-stone-400">
              .csv or .txt with comma-separated values: english,hausa,reviewed,definition,partOfSpeech,usageExample,domain
            </p>
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-stone-600 mb-1.5">
                Preview ({preview.length} entries)
                {parseErrors.length > 0 && (
                  <span className="text-rose-600 font-normal">
                    {" "}&middot; {parseErrors.length} skipped line(s)
                  </span>
                )}
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50">
                <ul className="divide-y divide-stone-200/60">
                  {preview.map((entry, i) => (
                    <li key={i} className="px-4 py-2.5 text-sm text-stone-700">
                      <span className="text-stone-400 tabular-nums mr-2">{i + 1}.</span>
                      <span className="font-medium">{entry.english}</span>
                      <span className="text-stone-400 mx-1.5">&rarr;</span>
                      {entry.hausa}
                      {entry.reviewed && (
                        <span className="ml-2 text-xs text-stone-400">({entry.reviewed})</span>
                      )}
                      {entry.domain && (
                        <span className="ml-2 text-[10px] text-stone-400 bg-stone-100 rounded px-1 py-0.5">{entry.domain}</span>
                      )}
                      {entry.partOfSpeech && (
                        <span className="ml-1 text-[10px] text-stone-400 italic">{entry.partOfSpeech}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={loading || preview.length === 0}>
            {loading ? "Uploading..." : `Upload ${preview.length} Entries`}
          </Button>
        </div>
        <ConfirmModal
          open={showConfirm}
          title="Upload Glossary Entries"
          message={`Are you sure you want to upload ${preview.length} glossary entries?`}
          confirmLabel="Upload"
          onConfirm={handleConfirmedUpload}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </div>
  );
}
