"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface User {
  id: string;
  name: string;
  role: string;
}

export function TaskForm({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingData = useRef<FormData | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    pendingData.current = new FormData(e.currentTarget);
    setShowConfirm(true);
  }

  async function handleConfirmedSubmit() {
    setShowConfirm(false);
    const formData = pendingData.current;
    if (!formData) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalContent: formData.get("originalContent"),
        assignedToId: formData.get("assignedToId") || undefined,
        reviewedById: formData.get("reviewedById") || undefined,
        dueDate: formData.get("dueDate") || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create task");
      setLoading(false);
      return;
    }

    setLoading(false);
    formRef.current?.reset();
    onCreated();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
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

      <Textarea
        id="originalContent"
        name="originalContent"
        label="Original Content"
        required
        placeholder="Enter the text to be translated..."
        rows={3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          id="assignedToId"
          name="assignedToId"
          label="Assign Translator"
          options={[
            { value: "", label: "Unassigned" },
            ...translators.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <Select
          id="reviewedById"
          name="reviewedById"
          label="Assign Reviewer"
          options={[
            { value: "", label: "Unassigned" },
            ...reviewers.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <Input
          id="dueDate"
          name="dueDate"
          label="Due Date"
          type="date"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Add Task"}
      </Button>
      <ConfirmModal
        open={showConfirm}
        title="Add Task"
        message="Are you sure you want to add this task?"
        confirmLabel="Add Task"
        onConfirm={handleConfirmedSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </form>
  );
}
