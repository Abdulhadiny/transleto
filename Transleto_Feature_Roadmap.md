# Transleto: Feature Roadmap & Implementation Guide

> This document outlines the six most strategically important features to add to Transleto, ranked by their impact on user productivity, product competitiveness, and business value. Each feature includes a methodology for implementation, a recommended technology stack, and an honest assessment of how much complexity it introduces — with particular sensitivity to Transleto's current scale as an emerging platform.

---

## Feature 1: Translation Memory (TM)

### Why It Comes First

Translation Memory is the single most impactful feature gap between Transleto and professional CAT tools. It is, in a very real sense, the defining technology of the entire computer-assisted translation industry. The core idea is elegantly simple: every translation segment that has been approved by a reviewer is stored as a matched pair — the English source on one side, the approved Hausa translation on the other. From that moment forward, whenever any translator in the system encounters a sentence that is identical or similar to one already in the database, the system surfaces the previous translation as a suggestion, ranked by a percentage of similarity.

This matters profoundly because in real-world content — especially tech and social media strings — repetition is everywhere. Phrases like "Please submit your work before the deadline," "Your task has been approved," or "Click here to continue" appear across dozens of projects. Without TM, every translator translates these from scratch every time. With TM, they confirm a pre-populated suggestion in seconds. Research consistently shows this can improve translator throughput by 40–60%.

Crucially, your existing pool of approved translations is not sitting idle — it is the seed data for your TM. The day you implement this, every previously approved translation in your database immediately becomes fuel for the system. You are not starting from zero.

### Suggested Implementation Methodology

The cleanest approach for Transleto's current architecture is to build the TM directly on top of your existing PostgreSQL database using its built-in trigram similarity extension. You do not need a separate search engine or external service for this at your current scale.

**Step 1 — Enable the PostgreSQL extension.** Run `CREATE EXTENSION IF NOT EXISTS pg_trgm;` in your database. This activates trigram-based similarity matching, which works by breaking text into overlapping three-character sequences and comparing how many sequences two strings share. It is fast, built-in, and requires no external dependencies.

**Step 2 — Create the Translation Memory table.** This table stores every approved segment pair. A minimal but well-designed schema looks like this:

```sql
CREATE TABLE translation_memory (
  id          SERIAL PRIMARY KEY,
  source_text TEXT NOT NULL,          -- The original English segment
  target_text TEXT NOT NULL,          -- The approved Hausa translation
  project_id  INTEGER REFERENCES projects(id),  -- Optional: for project-scoped TM
  created_by  INTEGER REFERENCES users(id),
  approved_at TIMESTAMP DEFAULT NOW(),
  use_count   INTEGER DEFAULT 0       -- Track how often this match gets used
);

-- Create a GIN index on source_text for fast similarity queries
CREATE INDEX tm_source_trgm_idx ON translation_memory
  USING GIN (source_text gin_trgm_ops);
```

**Step 3 — Populate it automatically.** Modify your existing task approval logic so that whenever a reviewer approves a translation, the system automatically inserts the source-target pair into `translation_memory`. This requires a small addition to your approval endpoint — no major architectural change.

**Step 4 — Query at task open.** When a translator opens a task, the backend queries the TM for similar segments and returns the top matches (e.g., top 5 results above 70% similarity), ranked by similarity score:

```sql
-- Find TM matches above 70% similarity, ordered by best match
SELECT
  source_text,
  target_text,
  SIMILARITY(source_text, :query_text) AS score
FROM translation_memory
WHERE SIMILARITY(source_text, :query_text) > 0.7
ORDER BY score DESC
LIMIT 5;
```

**Step 5 — Display in the editor.** In your Next.js translation editor, render a collapsible "TM Suggestions" panel showing each match with its similarity percentage colour-coded (100% in green, 85–99% in amber, 70–84% in grey). A single click populates the translation field with that suggestion, which the translator can then refine.

### Suggested Technologies

PostgreSQL `pg_trgm` extension handles all similarity matching natively. No additional service is needed until your TM table grows beyond approximately 500,000 segments, at which point you could migrate matching to a dedicated vector search service like **pgvector** (still within PostgreSQL) or **Meilisearch**. For the frontend suggestion panel, this is purely a React component with no new library dependencies.

### Complexity Assessment

This is a **low-to-medium complexity** addition for Transleto. The database work is entirely within your existing PostgreSQL instance using a built-in extension. The backend change is a small addition to your approval endpoint plus a new query endpoint. The frontend change is a new UI panel in the existing editor. There are no new infrastructure components, no new third-party services, and no new deployment concerns. The main implementation risk is correctly segmenting long-form source text into sentences before querying — you will want to split multi-sentence tasks at the sentence boundary before looking up TM matches, rather than querying the entire task text as one block. A simple sentence-splitting utility handles this.

**Estimated effort:** 1–2 weeks for a solo developer. This is the highest return-on-investment feature on this list.

---

## Feature 2: Automated Pre-Submission QA Checks

### Why It Comes Second

Right now, quality control in Transleto is entirely dependent on human reviewers reading every translation carefully. That is valuable and irreplaceable for meaning and style — but it misses an entire class of mechanical errors that a computer can catch instantly and reliably, before the translation ever reaches a reviewer. Missed numbers, untranslated segments, mismatched punctuation, glossary terms ignored — these are not judgment calls, they are rules, and machines are better at enforcing rules than humans under time pressure.

The professional CAT tool standard is to run a QA sweep automatically when a translator clicks "Submit for Review." Any flagged issues appear as warnings the translator must address or explicitly dismiss before the submission goes through. This single change materially reduces the back-and-forth rejection cycle — which is currently one of the biggest friction points in your workflow.

### Suggested Implementation Methodology

This feature is implemented entirely in backend logic — a QA rules engine that runs against a translation before submission is accepted. Think of it as a checklist that every translation must pass (or have its failures acknowledged) before leaving the translator's hands.

**Step 1 — Define your rule set.** Start with five high-value rules that catch the most common errors:

```
Rule 1 — Untranslated segment:
  If source_text == target_text, flag as ERROR.
  (The translator submitted the English unchanged.)

Rule 2 — Missing numbers:
  Extract all numeric tokens from source_text.
  If any are absent from target_text, flag as WARNING.
  (A figure like "500" or "2025" was dropped in translation.)

Rule 3 — Punctuation mismatch:
  Check the terminal punctuation of source and target.
  If source ends with "?" and target does not, flag as WARNING.

Rule 4 — Glossary term not used:
  For every English term in the glossary that appears in source_text,
  check if the approved Hausa equivalent appears in target_text.
  If not, flag as WARNING with the specific term named.

Rule 5 — Whitespace issues:
  Flag double spaces, leading spaces, or trailing spaces in target_text.
```

**Step 2 — Build the QA engine as a utility function.** In your Next.js backend (or a separate `/lib/qa-engine.ts` utility), write a function `runQAChecks(sourceText, targetText, glossary)` that returns an array of check results. Each result has a severity (`error` or `warning`), a rule name, and a human-readable message.

**Step 3 — Hook it into the submission endpoint.** In your task submission API route, call `runQAChecks()` before finalising the status change. If any `error`-level issues exist, block submission and return the issues to the frontend. For `warning`-level issues, allow submission but require the translator to check a "I have reviewed these warnings" acknowledgment checkbox.

**Step 4 — Display results in the editor.** In the translation editor, after the translator clicks "Submit," show a QA Results modal before confirming. Errors appear in red with an explanation, warnings in amber. The modal either sends them back to fix errors or asks them to confirm warnings before proceeding.

### Suggested Technologies

This feature requires no new libraries or services. The QA engine is pure JavaScript/TypeScript string processing logic living in your existing Next.js codebase. The glossary data you already have in PostgreSQL is the data source for Rule 4. The frontend modal is a standard React component.

### Complexity Assessment

This is a **low complexity** addition. It is entirely contained within your existing backend and frontend — no new tables, no new services, no new infrastructure. The main investment is time spent defining your rules carefully and testing edge cases (for example, making sure Rule 4 handles partial word matches correctly so it doesn't flag a false positive when a Hausa word contains a glossary term as a substring). You can start with just 2–3 rules and expand the set incrementally. The architecture supports this: adding a new rule is just adding a new function to the QA engine.

**Estimated effort:** 3–5 days. One of the fastest, highest-quality-of-life improvements you can make.

---

## Feature 3: Enriched Termbase (Upgrading the Glossary)

### Why It Comes Third

Your glossary is currently a flat list of English words paired with their Hausa equivalents. That is a solid foundation, but it is a thin one. Professional translation environments manage terminology through a proper **termbase** — each entry carries enough context, definition, and metadata that a translator can use a term with full confidence, without ambiguity. This matters especially for Hausa technical vocabulary, which is not standardized and where different translators may invent different equivalents for the same concept unless the termbase is authoritative enough to resolve the doubt.

The difference between a glossary and a termbase is the difference between a vocabulary list and a dictionary. The vocabulary list tells you the word; the dictionary tells you the word, what it means, how to use it, and what it is not.

### Suggested Implementation Methodology

This is primarily a database schema extension and a UI enhancement to your existing glossary pages.

**Step 1 — Extend the glossary table schema.** Add the following columns to your existing `glossary` table:

```sql
ALTER TABLE glossary
  ADD COLUMN definition       TEXT,          -- Plain-language explanation of the concept
  ADD COLUMN part_of_speech   VARCHAR(20),   -- noun, verb, adjective, etc.
  ADD COLUMN usage_example    TEXT,          -- Example sentence using the term in context
  ADD COLUMN domain           VARCHAR(50),   -- e.g., 'social_media', 'ui_strings', 'general'
  ADD COLUMN forbidden_terms  TEXT[],        -- Array of Hausa alternatives NOT to use
  ADD COLUMN status           VARCHAR(20) DEFAULT 'approved',  -- 'approved' or 'proposed'
  ADD COLUMN notes            TEXT;          -- Any additional translator guidance
```

**Step 2 — Update the bulk import format.** Extend your CSV import template to include these optional columns. Existing imports with only English and Hausa columns continue to work — the new fields simply default to null.

**Step 3 — Enrich the glossary UI.** On the glossary lookup panel within the translation editor, expand the entry display to show the definition and usage example when a translator clicks on a term. This gives them the confidence to use the approved term correctly without leaving the editor.

**Step 4 — Add a "proposed" workflow.** Allow translators to propose new glossary entries (with `status = 'proposed'`) from within the editor when they encounter a term not in the termbase. Admins can review and approve proposals from the glossary management page. This crowdsources terminology expansion while keeping admins in control.

### Suggested Technologies

No new technologies are required. This is a PostgreSQL schema change, a Next.js API update, and a React UI enhancement. If you later want to support the XLIFF bilingual format (see Feature 4), your enriched termbase maps naturally to the TBX (TermBase eXchange) format, which is the industry standard for exporting termbases to other tools.

### Complexity Assessment

This is a **very low complexity** addition in terms of architecture. Schema migrations in PostgreSQL with `ALTER TABLE` are straightforward, and the UI changes are incremental enhancements to pages that already exist. The main investment here is not technical — it is editorial. Someone on the team needs to go back through the existing glossary entries and enrich them with definitions, usage examples, and domain tags. That is content work, not engineering work, and it can be done gradually over time. The `proposed` terms workflow does add a small new feature (a new status, a new admin review action), but it is self-contained and follows the same pattern as your existing approve/reject workflow for tasks.

**Estimated effort:** 1 week for the technical changes; ongoing content effort to enrich existing entries.

---

## Feature 4: DOCX and HTML File Format Support

### Why It Comes Fourth

Currently, Transleto accepts translation tasks as plain text — typed directly or uploaded via CSV/TXT. This works well for the current workflow of translating individual strings and short passages. But as Transleto grows, the clients and teams you serve will increasingly want to bring entire documents and web content for translation. The most common real-world scenario is a Word document (DOCX) or a web page (HTML) that needs to be translated, with the formatting preserved. Without format support, those users have to manually copy-paste every paragraph into Transleto as individual tasks — which defeats the purpose of having a platform.

Supporting DOCX and HTML is the fastest way to expand the kinds of projects Transleto can accept without any change to the core translation workflow.

### Suggested Implementation Methodology

The key insight here is **segmentation**: when you import a document, you do not translate the whole file at once. You break it into individual translatable segments (paragraphs, sentences, headings, or strings), create a Transleto task for each segment, and then at export time, you reconstruct the original document with each segment replaced by its approved translation.

**Step 1 — DOCX parsing on upload.** When an admin uploads a DOCX file instead of a CSV, your backend uses the `mammoth` JavaScript library to extract the document's text content paragraph by paragraph. Each paragraph becomes a task. The original document's structure is stored so it can be reconstructed at export time.

```javascript
// Using mammoth.js to extract paragraphs from a DOCX upload
const mammoth = require('mammoth');
const result = await mammoth.extractRawText({ path: uploadedFilePath });
const paragraphs = result.value
  .split('\n')
  .filter(p => p.trim().length > 0); // Remove empty lines

// Each paragraph becomes one task in the project
const tasks = paragraphs.map((text, index) => ({
  source_text: text,
  order_index: index,  // Preserve order for reconstruction
  project_id: projectId,
}));
```

**Step 2 — HTML parsing.** For HTML files, use `cheerio` (a Node.js library that parses HTML like jQuery) to extract text nodes from meaningful tags (`<p>`, `<h1>`–`<h6>`, `<li>`, etc.) while ignoring scripts, styles, and markup. Each text node becomes a task.

**Step 3 — Export with reconstruction.** When an admin exports a project in its original format, the backend fetches all approved translations in order and reconstructs the document — writing approved Hausa text back into the original DOCX structure (using `docx` npm library) or back into the HTML template with translated text nodes replacing originals.

**Step 4 — Store segment order.** Add an `order_index` integer column to your tasks table to preserve the original sequence of segments within a document-based project. This is what allows correct reconstruction at export.

### Suggested Technologies

`mammoth` (npm) handles DOCX text extraction cleanly and is well-maintained. `cheerio` (npm) handles HTML parsing. `docx` (npm) handles DOCX generation at export time. None of these require external services — they run entirely in your Next.js backend. For a later stage, you could add XLIFF support (using the `xliff` npm library), which would make Transleto interoperable with the entire professional CAT ecosystem.

### Complexity Assessment

This is a **medium complexity** addition, and it is the first feature on this list that introduces a genuinely new data concern: **format preservation**. Translating plain text is simple — source in, target out. Translating a document means you must preserve heading levels, bold/italic formatting, list structure, link URLs, and so on. The segmentation approach above handles this by treating text extraction and document reconstruction as separate steps, which keeps the core translation workflow unchanged. However, edge cases are real: tables in DOCX files, nested HTML structures, inline formatting within a paragraph (part of a sentence is bold) — these require careful handling.

For Transleto's current stage, the pragmatic recommendation is to start with "flat document" support — DOCX files with paragraphs and headings only, no tables or complex formatting — and expand from there. Being transparent with users about what is and is not supported is far better than over-promising and producing broken output.

**Estimated effort:** 2–3 weeks, inclusive of testing edge cases in DOCX and HTML parsing.

---

## Feature 5: Custom LLM Integration (Replacing Google Translate)

### Why It Comes Fifth

This is Transleto's most powerful long-term differentiator, and it has already been discussed at length in the earlier conversation. A custom fine-tuned model trained on real Kano-dialect Hausa, with domain awareness for tech and social media content, produces translations that Google Translate fundamentally cannot match. Google Translate is trained on generic, standard Hausa — it does not understand dialect nuance, it does not know your organization's preferred terminology, and it was not trained on the specific vocabulary of Nigerian social media and tech content.

The reason it appears fifth rather than first is purely practical: it is the most technically complex item on this list, it requires a preparatory body of work (dataset collection, model training, infrastructure setup) that is substantial, and the other four features above can be built and shipped while the custom model work proceeds in parallel in the background.

### Suggested Implementation Methodology

The full implementation methodology for this was covered in detail in the earlier discussion. What follows is a condensed summary structured specifically around integration with Transleto.

**Phase 1 — Dataset construction.** This is the most critical phase and the one that determines model quality. Export all your approved translations from Transleto's database — every approved source-target pair is a training example. Supplement this with manually curated examples covering your key domains (social media copy, tech UI strings, news content). Aim for a minimum of 1,000 high-quality examples before training; 3,000–5,000 is significantly better. Structure every example as an instruction-tuning triplet:

```json
{
  "instruction": "Translate the following English text into Kano dialect Hausa.",
  "input": "Please review the submitted content before the deadline.",
  "output": "Don Allah ku duba abin da aka ƙaddamar kafin ƙarshen lokaci."
}
```

**Phase 2 — Fine-tune a base model.** Use Meta's **Llama 3.1 (8B)** or **Mistral 7B** as your starting point. Apply **LoRA fine-tuning** via the **Hugging Face TRL + PEFT** libraries. Train on a rented GPU (Google Colab Pro+, RunPod, or Vast.ai — approximately $2–5/hour). A training run of 1,000–3,000 examples typically takes 2–4 hours on a single A100 GPU.

**Phase 3 — Evaluate and iterate.** Compare your fine-tuned model's output against Google Translate on a held-out test set of 100 sentences. Evaluate using a combination of automatic metrics (BLEU score as a rough guide) and human judgment from your native Hausa-speaking translators. Their assessment is more reliable than any automatic metric for a dialect-specific task.

**Phase 4 — Self-host the model.** Deploy the fine-tuned model using **Ollama** (for low-traffic use, easy to set up on a basic cloud VM) or **vLLM** (for higher-traffic, production use). This gives you an HTTP endpoint that your Transleto backend can call exactly like it currently calls the Google Translate API.

**Phase 5 — Swap the API call.** In your Transleto backend, replace the Google Translate API call in your AI translation endpoint with a call to your self-hosted model endpoint. The interface for your translators changes not at all — the "AI Translation" button works exactly as before, it just uses your model instead of Google's.

### Suggested Technologies

Hugging Face Transformers, TRL, and PEFT for fine-tuning. Ollama for self-hosted serving (simplest path). Alternatively, Hugging Face Inference Endpoints for managed hosting (paid, but removes infrastructure management). The Masakhane project (an African NLP research initiative) has published some Hausa datasets and research that may supplement your own training data and is worth investigating.

### Complexity Assessment

This is a **high complexity** initiative — the most complex on this list — but the complexity is concentrated in the preparatory ML work, not in the Transleto integration itself. The integration step (swapping the API call) is trivially simple once the model is running. The complexity lives in: building a quality training dataset, understanding fine-tuning tooling well enough to run it successfully, evaluating model output objectively, and managing self-hosted model infrastructure with the reliability that a production translation platform requires. 

The honest guidance for an emerging product like Transleto is: do not let the model be a blocker. Start building the dataset now, learn the tooling in parallel, and run your first experimental fine-tune as a proof of concept. Ship Features 1–4 in the meantime. When the model is genuinely better than Google Translate on your content domain — verified by your translators — then swap it in. Prematurely replacing a working (if imperfect) tool with an experimental one introduces risk to the platform's core reliability.

**Estimated effort:** 1–3 months inclusive of dataset building, training, and evaluation cycles.

---

## Feature 6: A REST API for External Integrations

### Why It Comes Last

An API is not a feature that makes Transleto better for its *current* users — it is a feature that makes Transleto useful as *infrastructure* for other systems. It enables content creation tools to push new tasks to Transleto programmatically, and enables publishing systems to pull approved translations without anyone logging in. This is the difference between a standalone tool and a platform.

It comes last because for Transleto's current stage — a single organization's internal tool — the manual workflow is entirely sufficient, and building a robust external API before the core product is mature is a common premature investment. However, if Transleto is to expand beyond Malamiromba to serve other organizations, an API becomes essential. Without it, every new client requires the same manual workflow, which does not scale.

### Suggested Implementation Methodology

The cleanest approach is to expose a subset of your existing internal Next.js API routes publicly, protected by API key authentication.

**Step 1 — API key management.** Add an `api_keys` table to your database with columns for the key hash, the associated organization/user, permissions scope, and an active flag. Provide an admin UI for generating and revoking keys.

**Step 2 — Expose the minimum useful surface.** The initial API should cover just three capabilities: creating tasks in bulk within a project (`POST /api/v1/tasks`), querying task status and retrieving approved translations (`GET /api/v1/tasks`), and fetching a specific approved translation by task ID (`GET /api/v1/tasks/:id`). This minimal surface enables the primary use case — push content in, pull approved translations out — without exposing administrative functionality.

**Step 3 — Add webhook support.** Allow API clients to register a webhook URL for a project. When a translation is approved, Transleto POSTs the approved translation to that URL in real time. This eliminates the need for clients to poll for completion and is a significant quality-of-life improvement for any automated pipeline.

**Step 4 — Rate limiting and documentation.** Implement per-key rate limiting (to prevent abuse) and publish OpenAPI documentation for your endpoints. The `swagger-jsdoc` and `swagger-ui-express` npm packages generate API documentation from JSDoc comments with minimal overhead.

### Suggested Technologies

No new frameworks needed — your existing Next.js API routes are the foundation. `next-rate-limit` handles rate limiting. `swagger-jsdoc` generates API documentation. API key hashing should use `bcrypt` (which you may already have for password hashing). If you later want to support OAuth-style third-party integrations, you could add that on top of the key-based auth, but API keys are the right starting point for an emerging platform.

### Complexity Assessment

A minimal API as described above is a **low-to-medium complexity** addition. The database change is small (one new table). The API routes follow patterns you've already established. The main engineering care required is around security — API keys must be hashed before storage (never stored in plain text), all public endpoints must validate the key on every request, and the scope of what each key can access must be carefully controlled so that one organization's API key cannot touch another organization's data. These are solvable engineering problems, but they require deliberate attention. The webhook system adds some additional complexity (you need to reliably deliver POST requests to external URLs, handle failures with retries, etc.), and can reasonably be deferred to a second iteration.

**Estimated effort:** 2–3 weeks for the base API with authentication; an additional 1–2 weeks to add webhooks.

---

## Summary Table

| Priority | Feature | Complexity | Estimated Effort | Core Benefit |
|---|---|---|---|---|
| 1 | Translation Memory | Low–Medium | 1–2 weeks | 40–60% productivity gain for translators |
| 2 | Automated QA Checks | Low | 3–5 days | Fewer rejections, higher baseline quality |
| 3 | Enriched Termbase | Very Low | 1 week + editorial | Terminology consistency and translator confidence |
| 4 | DOCX & HTML Support | Medium | 2–3 weeks | Expands project types and client base |
| 5 | Custom LLM Integration | High | 1–3 months | Dialect-accurate AI translation; primary market differentiator |
| 6 | REST API | Low–Medium | 2–4 weeks | Enables automation and external integrations |

---

## A Note on Sequencing for an Emerging Product

The temptation when looking at a list like this is to want to build everything at once, or to jump straight to the most impressive-sounding item (the custom LLM). Resist both impulses. Features 1 and 2 together — Translation Memory and QA Checks — can be built in roughly three weeks and will make a *measurable, daily difference* to every translator and reviewer on the platform. They address the core workflow. Features 3 and 4 consolidate and expand that workflow. Feature 5 is your competitive moat and is worth building carefully rather than quickly. Feature 6 is your growth infrastructure and becomes relevant as you prepare to expand.

The right engineering philosophy for a tool at Transleto's stage is: solve the daily pain of your current users deeply before solving the theoretical needs of future users broadly. The features above, in this order, do exactly that.
