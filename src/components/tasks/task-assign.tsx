"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface User {
  id: string;
  name: string;
  role: string;
}

interface TaskAssignProps {
  taskId: string;
  currentTranslatorId?: string | null;
  currentReviewerId?: string | null;
  currentDueDate?: string | null;
  onUpdate: () => void;
}

function formatDateForInput(dateStr?: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export function TaskAssign({
  taskId,
  currentTranslatorId,
  currentReviewerId,
  currentDueDate,
  onUpdate,
}: TaskAssignProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [translatorId, setTranslatorId] = useState(currentTranslatorId || "");
  const [reviewerId, setReviewerId] = useState(currentReviewerId || "");
  const [dueDate, setDueDate] = useState(formatDateForInput(currentDueDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/users?pageSize=100")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.data)) setUsers(data.data);
      })
      .catch(() => {});
  }, []);

  const translators = users.filter((u) => u.role === "TRANSLATOR");
  const reviewers = users.filter((u) => u.role === "REVIEWER");

  const hasChanges =
    translatorId !== (currentTranslatorId || "") ||
    reviewerId !== (currentReviewerId || "") ||
    dueDate !== formatDateForInput(currentDueDate);

  function handleSave() {
    setShowConfirm(true);
  }

  async function handleConfirmedSave() {
    setShowConfirm(false);
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignedToId: translatorId || null,
        reviewedById: reviewerId || null,
        dueDate: dueDate || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update assignment");
    } else {
      setSuccess("Assignment updated");
      setTimeout(() => setSuccess(""), 2000);
      onUpdate();
    }

    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200/60 px-4 py-2.5 text-sm text-rose-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 shrink-0 text-rose-400 hover:text-rose-600">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200/60 px-4 py-2.5 text-sm text-teal-700">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          id="translator"
          label="Translator"
          value={translatorId}
          onChange={(e) => setTranslatorId(e.target.value)}
          options={[
            { value: "", label: "Unassigned" },
            ...translators.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <Select
          id="reviewer"
          label="Reviewer"
          value={reviewerId}
          onChange={(e) => setReviewerId(e.target.value)}
          options={[
            { value: "", label: "Unassigned" },
            ...reviewers.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <Input
          id="dueDate"
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
        {saving ? "Saving..." : "Update Assignment"}
      </Button>
      <ConfirmModal
        open={showConfirm}
        title="Update Assignment"
        message="Are you sure you want to update this assignment?"
        confirmLabel="Update"
        onConfirm={handleConfirmedSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
