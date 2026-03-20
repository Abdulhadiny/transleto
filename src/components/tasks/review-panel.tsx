"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/tasks/status-badge";
import { TaskStatus } from "@prisma/client";

interface ReviewPanelProps {
  taskId: string;
  originalContent: string;
  translatedContent?: string | null;
  status: string;
  reviewNote?: string | null;
  onUpdate: () => void;
}

export function ReviewPanel({
  taskId,
  originalContent,
  translatedContent,
  status,
  reviewNote,
  onUpdate,
}: ReviewPanelProps) {
  const [editedTranslation, setEditedTranslation] = useState(translatedContent || "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canReview = status === "SUBMITTED";
  const isFinalized = status === "APPROVED" || status === "REJECTED";

  async function handleReview(action: "APPROVED" | "REJECTED") {
    if (action === "REJECTED" && !note.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    setError("");

    const translationChanged = editedTranslation !== (translatedContent || "");

    const res = await fetch(`/api/tasks/${taskId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: action,
        reviewNote: note || undefined,
        ...(translationChanged && { translatedContent: editedTranslation }),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to review");
    }

    setLoading(false);
    onUpdate();
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200/60 px-4 py-3 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
          <button onClick={() => setError("")} className="ml-2 shrink-0 text-rose-400 hover:text-rose-600">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      {isFinalized && reviewNote && (
        <div className={`flex gap-3 rounded-lg border px-4 py-3 ${
          status === "APPROVED"
            ? "bg-teal-50 border-teal-200/60"
            : "bg-amber-50 border-amber-200/60"
        }`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-stone-800">Review Note</p>
              <StatusBadge status={status as TaskStatus} />
            </div>
            <p className="text-sm text-stone-600">{reviewNote}</p>
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

        {canReview ? (
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-stone-600 mb-1.5">
              Translation (editable)
            </label>
            <textarea
              value={editedTranslation}
              onChange={(e) => setEditedTranslation(e.target.value)}
              placeholder="Edit translation if needed..."
              className="flex-1 block w-full rounded-lg border border-stone-200 hover:border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y min-h-[160px]"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">
              Translation
            </label>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm min-h-[160px] whitespace-pre-wrap text-stone-700 leading-relaxed">
              {translatedContent || "No translation provided yet."}
            </div>
          </div>
        )}
      </div>

      {canReview && (
        <>
          <Textarea
            label="Review Note (required for rejection)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Provide feedback or reason for rejection..."
            rows={3}
          />

          <div className="flex gap-3">
            <Button
              onClick={() => handleReview("APPROVED")}
              disabled={loading}
            >
              {loading ? "Processing..." : "Approve"}
            </Button>
            <Button
              variant="danger"
              onClick={() => handleReview("REJECTED")}
              disabled={loading}
            >
              {loading ? "Processing..." : "Reject with Corrections"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
