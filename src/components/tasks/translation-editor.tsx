"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TMSuggestion {
  id: string;
  sourceText: string;
  targetText: string;
  similarity: number;
  usageCount: number;
}

interface GlossaryTerm {
  english: string;
  hausa: string;
}

interface GlossaryLookupResult {
  found: boolean;
  english?: string;
  hausa?: string;
  definition?: string | null;
  partOfSpeech?: string | null;
  usageExample?: string | null;
  domain?: string | null;
  forbiddenTerms?: string[];
  notes?: string | null;
}

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
  const [suggesting, setSuggesting] = useState(false);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [suggestError, setSuggestError] = useState("");
  const [glossaryWord, setGlossaryWord] = useState("");
  const [glossaryLookup, setGlossaryLookup] = useState<GlossaryLookupResult | null>(null);
  const [glossaryDetailExpanded, setGlossaryDetailExpanded] = useState(false);
  const [checkingGlossary, setCheckingGlossary] = useState(false);
  const [tmSuggestions, setTmSuggestions] = useState<TMSuggestion[]>([]);
  const [tmLoading, setTmLoading] = useState(false);
  const [tmExpanded, setTmExpanded] = useState(true);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposeEnglish, setProposeEnglish] = useState("");
  const [proposeHausa, setProposeHausa] = useState("");
  const [proposeDefinition, setProposeDefinition] = useState("");
  const [proposing, setProposing] = useState(false);
  const [proposeSuccess, setProposeSuccess] = useState("");

  const canEdit = status === "NOT_STARTED" || status === "IN_PROGRESS" || status === "REJECTED";
  const canSubmit = canEdit && translation.trim().length > 0;

  useEffect(() => {
    if (!originalContent) return;
    setTmLoading(true);
    fetch(`/api/translation-memory/search?q=${encodeURIComponent(originalContent)}`)
      .then((res) => res.json())
      .then((data) => {
        const matches = (data.results || []).filter(
          (m: TMSuggestion) => m.similarity >= 0.5
        );
        setTmSuggestions(matches);
      })
      .catch(() => setTmSuggestions([]))
      .finally(() => setTmLoading(false));
  }, [originalContent]);

  function handleApplyTM(suggestion: TMSuggestion) {
    setTranslation(suggestion.targetText);
    fetch(`/api/translation-memory/${suggestion.id}/use`, { method: "POST" }).catch(() => {});
  }

  async function handleCheckGlossary() {
    if (!glossaryWord.trim()) return;
    setCheckingGlossary(true);
    setGlossaryLookup(null);
    setGlossaryDetailExpanded(false);
    setShowProposeForm(false);
    setProposeSuccess("");

    try {
      const res = await fetch(
        `/api/glossary/lookup?word=${encodeURIComponent(glossaryWord.trim())}`
      );
      const data: GlossaryLookupResult = await res.json();
      setGlossaryLookup(data);
      if (data.found && (data.definition || data.usageExample)) {
        setGlossaryDetailExpanded(true);
      }
    } catch {
      setGlossaryLookup({ found: false });
    } finally {
      setCheckingGlossary(false);
    }
  }

  async function handleProposeTerm() {
    if (!proposeEnglish.trim() || !proposeHausa.trim()) return;
    setProposing(true);
    setProposeSuccess("");

    try {
      const res = await fetch("/api/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          english: proposeEnglish.trim(),
          hausa: proposeHausa.trim(),
          definition: proposeDefinition.trim() || undefined,
          status: "proposed",
        }),
      });
      if (res.ok) {
        setProposeSuccess("Term proposed successfully!");
        setShowProposeForm(false);
        setProposeEnglish("");
        setProposeHausa("");
        setProposeDefinition("");
      }
    } catch {
      // silent fail
    } finally {
      setProposing(false);
    }
  }

  async function handleSuggest() {
    setSuggesting(true);
    setSuggestError("");

    try {
      const res = await fetch(`/api/tasks/${taskId}/suggest`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setTranslation(data.suggestion);
      } else {
        setSuggestError(data.error || "Failed to get suggestion");
      }
    } catch {
      setSuggestError("Network error — could not reach translation service");
    } finally {
      setSuggesting(false);
    }
  }

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

      {suggestError && (
        <div className="flex items-center justify-between rounded-lg bg-sky-50 border border-sky-200/60 px-4 py-3 text-sm text-sky-700">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            {suggestError}
          </div>
          <button onClick={() => setSuggestError("")} className="ml-2 shrink-0 text-sky-400 hover:text-sky-600">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
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

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Translation
          </label>
          <textarea
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            disabled={!canEdit}
            placeholder="Enter your translation here..."
            className="flex-1 block w-full rounded-lg border border-stone-200 hover:border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-y min-h-[160px]"
          />
        </div>
      </div>

      {tmLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-200/60 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Searching translation memory...
        </div>
      )}

      {!tmLoading && tmSuggestions.length > 0 && (
        <div className="rounded-lg border border-sky-200/60 bg-sky-50">
          <button
            onClick={() => setTmExpanded(!tmExpanded)}
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <p className="text-sm font-medium text-sky-800">
              Translation Memory ({tmSuggestions.length} {tmSuggestions.length === 1 ? "match" : "matches"})
            </p>
            <svg
              className={`h-4 w-4 text-sky-500 transition-transform ${tmExpanded ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          {tmExpanded && (
            <div className="space-y-2 px-4 pb-3">
              {tmSuggestions.map((s) => {
                const pct = Math.round(s.similarity * 100);
                const badgeClass =
                  pct === 100
                    ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                    : pct >= 85
                      ? "bg-amber-100 border-amber-200 text-amber-700"
                      : "bg-stone-100 border-stone-200 text-stone-600";
                return (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 rounded-md border border-sky-100 bg-white p-3"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
                          {pct}%
                        </span>
                        {s.usageCount > 0 && (
                          <span className="text-[10px] text-stone-400">
                            used {s.usageCount}x
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 truncate">{s.sourceText}</p>
                      <p className="text-sm text-stone-800">{s.targetText}</p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleApplyTM(s)}
                        className="shrink-0 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-200 transition-colors"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {glossaryTerms.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200/60 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-amber-800">Glossary Hints</p>
            <button onClick={() => setGlossaryTerms([])} className="text-amber-400 hover:text-amber-600">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {glossaryTerms.map((term) => (
              <span
                key={term.english}
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs text-amber-800"
              >
                {term.english} → {term.hausa}
              </span>
            ))}
          </div>
        </div>
      )}

      {canEdit && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div>
              <Button
                variant="secondary"
                onClick={handleSuggest}
                disabled={suggesting}
              >
                {suggesting ? (
                  <>
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Translating...
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 1l2.39 5.645L18 7.49l-4.18 3.635L15.18 17 10 13.71 4.82 17l1.36-5.875L2 7.49l5.61-.845L10 1z" />
                    </svg>
                    AI Translation
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <Button
                variant="secondary"
                onClick={handleCheckGlossary}
                disabled={checkingGlossary || !glossaryWord.trim()}
              >
                {checkingGlossary ? (
                  <>
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Checking...
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                    </svg>
                    Check Glossary
                  </>
                )}
              </Button>
              <input
                type="text"
                value={glossaryWord}
                onChange={(e) => {
                  setGlossaryWord(e.target.value);
                  setGlossaryLookup(null);
                  setShowProposeForm(false);
                  setProposeSuccess("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCheckGlossary();
                }}
                placeholder="Enter a word..."
                className="h-7 sm:h-9 rounded-lg border border-stone-200 bg-white px-2 sm:px-3 text-xs sm:text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 w-32 sm:w-44"
              />
              {glossaryLookup && glossaryLookup.found && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
                  {glossaryLookup.english} → {glossaryLookup.hausa}
                  {(glossaryLookup.definition || glossaryLookup.usageExample) && (
                    <button
                      onClick={() => setGlossaryDetailExpanded(!glossaryDetailExpanded)}
                      className="ml-0.5 hover:opacity-70"
                      title="Toggle details"
                    >
                      <svg className={`h-3 w-3 transition-transform ${glossaryDetailExpanded ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => setGlossaryLookup(null)}
                    className="ml-0.5 hover:opacity-70"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </span>
              )}
              {glossaryLookup && !glossaryLookup.found && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-stone-100 text-stone-600">
                  Not available
                  <button
                    onClick={() => setGlossaryLookup(null)}
                    className="ml-0.5 hover:opacity-70"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </span>
              )}
            </div>

            {/* Enriched glossary detail panel */}
            {glossaryLookup?.found && glossaryDetailExpanded && (
              <div className="rounded-lg border border-emerald-200/60 bg-emerald-50 px-4 py-3 space-y-2">
                {glossaryLookup.partOfSpeech && (
                  <p className="text-xs text-emerald-600">
                    <span className="font-medium">Part of Speech:</span> {glossaryLookup.partOfSpeech}
                  </p>
                )}
                {glossaryLookup.definition && (
                  <p className="text-xs text-emerald-700">
                    <span className="font-medium">Definition:</span> {glossaryLookup.definition}
                  </p>
                )}
                {glossaryLookup.usageExample && (
                  <p className="text-xs text-emerald-700 italic">
                    <span className="font-medium not-italic">Example:</span> {glossaryLookup.usageExample}
                  </p>
                )}
                {glossaryLookup.domain && (
                  <p className="text-xs text-emerald-600">
                    <span className="font-medium">Domain:</span> {glossaryLookup.domain}
                  </p>
                )}
                {glossaryLookup.notes && (
                  <p className="text-xs text-emerald-600">
                    <span className="font-medium">Notes:</span> {glossaryLookup.notes}
                  </p>
                )}
                {glossaryLookup.forbiddenTerms && glossaryLookup.forbiddenTerms.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-xs font-medium text-rose-600">Forbidden:</span>
                    {glossaryLookup.forbiddenTerms.map((term, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] text-rose-700">
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Propose term button and form */}
            {glossaryLookup && !glossaryLookup.found && canEdit && !showProposeForm && !proposeSuccess && (
              <button
                onClick={() => {
                  setShowProposeForm(true);
                  setProposeEnglish(glossaryWord.trim());
                }}
                className="text-xs text-amber-700 hover:text-amber-900 underline underline-offset-2"
              >
                Propose this term for the glossary
              </button>
            )}

            {proposeSuccess && (
              <p className="text-xs text-emerald-600 font-medium">{proposeSuccess}</p>
            )}

            {showProposeForm && (
              <div className="rounded-lg border border-amber-200/60 bg-amber-50 px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-amber-800">Propose New Term</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={proposeEnglish}
                    onChange={(e) => setProposeEnglish(e.target.value)}
                    placeholder="English"
                    className="rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <input
                    type="text"
                    value={proposeHausa}
                    onChange={(e) => setProposeHausa(e.target.value)}
                    placeholder="Hausa"
                    className="rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <input
                  type="text"
                  value={proposeDefinition}
                  onChange={(e) => setProposeDefinition(e.target.value)}
                  placeholder="Definition (optional)"
                  className="w-full rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleProposeTerm}
                    disabled={proposing || !proposeEnglish.trim() || !proposeHausa.trim()}
                    className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {proposing ? "Proposing..." : "Propose"}
                  </button>
                  <button
                    onClick={() => setShowProposeForm(false)}
                    className="rounded-md bg-white border border-amber-200 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 sm:gap-3">
            <Button variant="secondary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
