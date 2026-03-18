"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ReviewPanelProps {
  taskId: string;
  originalContent: string;
  translatedContent?: string | null;
  status: string;
  onUpdate: () => void;
}

export function ReviewPanel({
  taskId,
  originalContent,
  translatedContent,
  status,
  onUpdate,
}: ReviewPanelProps) {
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canReview = status === "SUBMITTED";

  async function handleReview(action: "APPROVED" | "REJECTED") {
    if (action === "REJECTED" && !reviewNote.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/tasks/${taskId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: action,
        reviewNote: reviewNote || undefined,
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Original Content
          </label>
          <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm min-h-[120px] whitespace-pre-wrap">
            {originalContent}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Translation
          </label>
          <div className="rounded-md border border-gray-300 bg-blue-50 p-3 text-sm min-h-[120px] whitespace-pre-wrap">
            {translatedContent || "No translation provided yet."}
          </div>
        </div>
      </div>

      {canReview && (
        <>
          <Textarea
            label="Review Note (required for rejection)"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Provide feedback..."
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
              {loading ? "Processing..." : "Reject"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
