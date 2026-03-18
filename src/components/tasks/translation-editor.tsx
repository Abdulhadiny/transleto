"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TranslationEditorProps {
  taskId: string;
  originalContent: string;
  translatedContent?: string | null;
  status: string;
  reviewNote?: string | null;
  onUpdate: () => void;
}

export function TranslationEditor({
  taskId,
  originalContent,
  translatedContent,
  status,
  reviewNote,
  onUpdate,
}: TranslationEditorProps) {
  const [translation, setTranslation] = useState(translatedContent || "");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canEdit = status === "NOT_STARTED" || status === "IN_PROGRESS" || status === "REJECTED";
  const canSubmit = canEdit && translation.trim().length > 0;

  async function handleSave() {
    setSaving(true);
    setError("");

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        translatedContent: translation,
        status: "IN_PROGRESS",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }

    setSaving(false);
    onUpdate();
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/tasks/${taskId}/submit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translatedContent: translation }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to submit");
    }

    setSubmitting(false);
    onUpdate();
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200/60 px-4 py-3 text-sm text-rose-700">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {reviewNote && status === "REJECTED" && (
        <div className="flex gap-3 rounded-lg bg-amber-50 border border-amber-200/60 px-4 py-3">
          <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Reviewer Feedback</p>
            <p className="text-sm text-amber-700 mt-1">{reviewNote}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Original Content
          </label>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm min-h-[160px] whitespace-pre-wrap text-stone-700 leading-relaxed">
            {originalContent}
          </div>
        </div>

        <Textarea
          label="Translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          disabled={!canEdit}
          rows={6}
          placeholder="Enter your translation here..."
          className="min-h-[160px]"
        />
      </div>

      {canEdit && (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      )}
    </div>
  );
}
