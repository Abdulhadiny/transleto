"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {});
  }, []);

  const translators = users.filter((u) => u.role === "TRANSLATOR");
  const reviewers = users.filter((u) => u.role === "REVIEWER");

  const hasChanges =
    translatorId !== (currentTranslatorId || "") ||
    reviewerId !== (currentReviewerId || "") ||
    dueDate !== formatDateForInput(currentDueDate);

  async function handleSave() {
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
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-2 text-sm text-green-600">{success}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
    </div>
  );
}
