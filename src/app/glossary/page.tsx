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
  createdAt: string;
  updatedAt: string;
}

interface EditingCell {
  id: string;
  field: "english" | "hausa" | "reviewed";
}

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
  const pageSize = 20;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEntries();
  }, [page]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  async function fetchEntries(p = page) {
    try {
      const res = await fetch(`/api/glossary?page=${p}&pageSize=${pageSize}`);
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
    if (!entry || entry[editingCell.field] === editValue) {
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

  function startEditing(id: string, field: EditingCell["field"], currentValue: string) {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveCell();
    if (e.key === "Escape") setEditingCell(null);
  }

  function renderCell(entry: GlossaryEntry, field: EditingCell["field"]) {
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
          {session?.user?.role === "ADMIN" && (
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
            <span className="text-xs text-stone-400">
              {total} {total === 1 ? "entry" : "entries"}
            </span>
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
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-stone-400 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {entries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`group transition-colors hover:bg-stone-50/50 ${saving === entry.id ? "opacity-60" : ""}`}
                    >
                      <td className="px-6 py-2 text-xs font-medium text-stone-400 tabular-nums">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-1">{renderCell(entry, "english")}</td>
                      <td className="px-4 py-1">{renderCell(entry, "hausa")}</td>
                      <td className="px-4 py-1">{renderCell(entry, "reviewed")}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                          title="Delete entry"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </td>
                    </tr>
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
