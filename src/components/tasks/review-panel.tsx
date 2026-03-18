"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {isFinalized && reviewNote && (
        <div className={`rounded-md border p-3 ${status === "APPROVED" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
          <p className="text-sm font-medium text-gray-800">
            Review Note <Badge variant={status === "APPROVED" ? "success" : "danger"}>{status}</Badge>
          </p>
          <p className="text-sm text-gray-600 mt-1">{reviewNote}</p>
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

        {canReview ? (
          <Textarea
            label="Translation (editable)"
            value={editedTranslation}
            onChange={(e) => setEditedTranslation(e.target.value)}
            rows={6}
            placeholder="Edit translation if needed..."
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Translation
            </label>
            <div className="rounded-md border border-gray-300 bg-blue-50 p-3 text-sm min-h-[120px] whitespace-pre-wrap">
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

          <div className="flex gap-2">
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
