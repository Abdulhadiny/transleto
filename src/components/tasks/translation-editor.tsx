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
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {reviewNote && status === "REJECTED" && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-sm font-medium text-yellow-800">Reviewer Feedback:</p>
          <p className="text-sm text-yellow-700 mt-1">{reviewNote}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Original Content
          </label>
          <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm min-h-[120px] whitespace-pre-wrap">
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
        />
      </div>

      {canEdit && (
        <div className="flex gap-2">
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
