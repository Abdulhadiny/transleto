"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { BulkEntryModal } from "@/components/glossary/bulk-entry-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface GlossaryEntry {
  id: string;
  english: string;
  hausa: string;
  reviewed: string;
  definition?: string | null;
  partOfSpeech?: string | null;
  usageExample?: string | null;
  domain?: string | null;
  forbiddenTerms?: string[];
  notes?: string | null;
  status: string;
  proposedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EditingCell {
  id: string;
  field: "english" | "hausa" | "reviewed" | "definition" | "partOfSpeech" | "usageExample" | "domain" | "notes";
}

type StatusFilter = "all" | "approved" | "proposed";

export default function GlossaryPage() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const pageSize = 20;
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchEntries();
  }, [page, statusFilter]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
    if (editingCell && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingCell]);

  async function fetchEntries(p = page) {
    try {
      const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const res = await fetch(`/api/glossary?page=${p}&pageSize=${pageSize}${statusParam}`);
      if (res.ok) {
        const json = await res.json();
        setEntries(json.data);
        setTotal(json.total);
      }
    } finally {
      setLoading(false);
    }
  }

  async function addEntry() {
    const res = await fetch("/api/glossary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ english: "", hausa: "" }),
    });
    if (res.ok) {
      const entry = await res.json();
      setPage(1);
      await fetchEntries(1);
      setEditingCell({ id: entry.id, field: "english" });
      setEditValue("");
    }
  }

  async function saveCell() {
    if (!editingCell) return;

    const entry = entries.find((e) => e.id === editingCell.id);
    if (!entry) {
      setEditingCell(null);
      return;
    }

    const currentValue = entry[editingCell.field as keyof GlossaryEntry] ?? "";
    if (currentValue === editValue) {
      setEditingCell(null);
      return;
    }

    setSaving(editingCell.id);
    try {
      const res = await fetch(`/api/glossary/${editingCell.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editingCell.field]: editValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      }
    } finally {
      setSaving(null);
      setEditingCell(null);
    }
  }

  function deleteEntry(id: string) {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  }

  async function handleConfirmedDelete() {
    setShowDeleteConfirm(false);
    if (!deletingId) return;
    const res = await fetch(`/api/glossary/${deletingId}`, { method: "DELETE" });
    if (res.ok) {
      if (entries.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchEntries();
      }
    }
    setDeletingId(null);
  }

  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/glossary/${id}/approve`, { method: "PATCH" });
      if (res.ok) {
        const updated = await res.json();
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      }
    } finally {
      setApprovingId(null);
    }
  }

  function startEditing(id: string, field: EditingCell["field"], currentValue: string) {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) saveCell();
    if (e.key === "Escape") setEditingCell(null);
  }

  function renderCell(entry: GlossaryEntry, field: "english" | "hausa" | "reviewed") {
    const isEditing = editingCell?.id === entry.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveCell}
          onKeyDown={handleKeyDown}
          className="w-full rounded-md border border-amber-400 bg-white px-2.5 py-1.5 text-sm text-stone-900 outline-none ring-2 ring-amber-500/20"
        />
      );
    }

    return (
      <div
        onClick={() => startEditing(entry.id, field, entry[field])}
        className="cursor-pointer rounded-md px-2.5 py-1.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors min-h-[34px] flex items-center"
      >
        {entry[field] || <span className="text-stone-300 italic">Click to edit</span>}
      </div>
    );
  }

  function renderDetailField(entry: GlossaryEntry, field: EditingCell["field"], label: string, isTextarea = false) {
    const isEditing = editingCell?.id === entry.id && editingCell?.field === field;
    const value = (entry[field as keyof GlossaryEntry] as string) ?? "";

    if (isEditing) {
      if (isTextarea) {
        return (
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveCell}
              onKeyDown={handleKeyDown}
              rows={2}
              className="w-full rounded-md border border-amber-400 bg-white px-2.5 py-1.5 text-sm text-stone-900 outline-none ring-2 ring-amber-500/20 resize-y"
            />
          </div>
        );
      }
      return (
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveCell}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-amber-400 bg-white px-2.5 py-1.5 text-sm text-stone-900 outline-none ring-2 ring-amber-500/20"
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
        <div
          onClick={() => startEditing(entry.id, field, value)}
          className="cursor-pointer rounded-md px-2.5 py-1.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors min-h-[30px] flex items-center border border-stone-100"
        >
          {value || <span className="text-stone-300 italic">Click to edit</span>}
        </div>
      </div>
    );
  }

  function renderStatusBadge(status: string) {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
          Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
        Proposed
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Glossary</h1>
          <p className="text-sm text-stone-500 mt-1">
            Shared word bank of English-Hausa translations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="secondary" onClick={() => setShowBulkModal(true)}>
              Bulk Upload
            </Button>
          )}
          <Button onClick={addEntry}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Entry
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-800">
              All Entries
            </h2>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
                  className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="proposed">Proposed</option>
                </select>
              )}
              <span className="text-xs text-stone-400">
                {total} {total === 1 ? "entry" : "entries"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-stone-100" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="mx-auto h-10 w-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="mt-3 text-sm font-medium text-stone-500">No glossary entries yet</p>
              <p className="mt-1 text-xs text-stone-400">Click &ldquo;Add Entry&rdquo; to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 w-14">S/N</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">English</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">Hausa</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400">Reviewed</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 w-24">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-400 w-24">Domain</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-stone-400 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {entries.map((entry, index) => (
                    <>
                      <tr
                        key={entry.id}
                        className={`group transition-colors hover:bg-stone-50/50 ${saving === entry.id ? "opacity-60" : ""} ${expandedId === entry.id ? "bg-stone-50/30" : ""}`}
                      >
                        <td className="px-6 py-2 text-xs font-medium text-stone-400 tabular-nums">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-4 py-1">{renderCell(entry, "english")}</td>
                        <td className="px-4 py-1">{renderCell(entry, "hausa")}</td>
                        <td className="px-4 py-1">{renderCell(entry, "reviewed")}</td>
                        <td className="px-4 py-2">{renderStatusBadge(entry.status)}</td>
                        <td className="px-4 py-2 text-xs text-stone-500">
                          {entry.domain || <span className="text-stone-300">&mdash;</span>}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                              className="inline-flex items-center justify-center rounded-md p-1.5 text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-600"
                              title="Toggle details"
                            >
                              <svg className={`h-4 w-4 transition-transform ${expandedId === entry.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                            {isAdmin && entry.status === "proposed" && (
                              <button
                                onClick={() => handleApprove(entry.id)}
                                disabled={approvingId === entry.id}
                                className="inline-flex items-center justify-center rounded-md p-1.5 text-emerald-500 transition-all hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                                title="Approve entry"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="inline-flex items-center justify-center rounded-md p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                              title="Delete entry"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === entry.id && (
                        <tr key={`${entry.id}-detail`} className="bg-stone-50/50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
                              {renderDetailField(entry, "definition", "Definition", true)}
                              {renderDetailField(entry, "usageExample", "Usage Example", true)}
                              {renderDetailField(entry, "partOfSpeech", "Part of Speech")}
                              {renderDetailField(entry, "notes", "Notes", true)}
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1">Forbidden Terms</label>
                                <div className="flex flex-wrap gap-1 min-h-[30px] items-center px-2.5 py-1.5 border border-stone-100 rounded-md">
                                  {entry.forbiddenTerms && entry.forbiddenTerms.length > 0 ? (
                                    entry.forbiddenTerms.map((term, i) => (
                                      <span key={i} className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs text-rose-700">
                                        {term}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-sm text-stone-300 italic">No forbidden terms</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>

      <BulkEntryModal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={fetchEntries}
      />
      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Entry"
        message="Are you sure you want to delete this glossary entry?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmedDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingId(null); }}
      />
    </div>
  );
}
