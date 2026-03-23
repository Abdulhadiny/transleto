# Transleto

**Translation Workflow Management System**

---

## Overview

Transleto is a collaborative translation management platform built for teams that need structured, high-quality translation workflows. It provides a complete environment for managing translation projects from content ingestion through final review and export, with built-in tools for terminology consistency and translation reuse.

The platform supports multi-role collaboration between administrators, translators, and reviewers with clearly defined workflows, quality gates, and full audit visibility.

---

## The Problem

Organizations managing translation work — whether for documents, product content, or institutional materials — face recurring challenges:

- **No structured workflow.** Translations are passed around via email or shared drives with no clear status tracking, assignment ownership, or review gates. Work gets lost, duplicated, or shipped without review.
- **Inconsistent terminology.** Without a shared glossary, different translators use different terms for the same concept, producing inconsistent output across documents and projects.
- **Wasted effort.** Previously translated content is not reused. Translators re-translate the same sentences across projects, wasting time and introducing variance.
- **No accountability.** There is no audit trail showing who translated what, when it was reviewed, or why a translation was approved or rejected.
- **Manual document handling.** Translators receive entire documents but must work in external tools, manually splitting content into translatable segments and reassembling the output.

---

## How Transleto Solves It

### Structured Role-Based Workflow

Every translation follows a defined lifecycle with clear ownership at each stage:

| Stage | Actor | Action |
|-------|-------|--------|
| Creation | Admin | Creates tasks — individually, via bulk upload (.txt/.csv), or by uploading documents (.docx/.html) |
| Assignment | Admin | Assigns a translator and optionally a reviewer; both receive notifications |
| Translation | Translator | Translates with assistance from AI suggestions, translation memory, and glossary lookups |
| Submission | Translator | Submits completed translation for review |
| Review | Reviewer | Approves (translation enters memory) or rejects with feedback (returns to translator) |
| Export | Admin | Exports approved translations in CSV, JSON, DOCX, or reconstructed document format |

**Task statuses:** `Not Started` > `In Progress` > `Submitted` > `Approved` / `Rejected`

### Three User Roles

- **Admin** — Full platform access. Creates projects, manages users, assigns work, configures the glossary, views audit logs, and exports deliverables.
- **Translator** — Sees only assigned tasks. Translates content with integrated tools (AI suggestions, translation memory, glossary). Can save drafts, submit for review, and propose new glossary terms.
- **Reviewer** — Sees only tasks assigned for review. Approves or rejects submissions with feedback. Can edit translations before approval.

Each role sees a tailored dashboard with relevant metrics:
- Admins see project counts, unassigned tasks, and items pending review.
- Translators see their assigned, in-progress, submitted, and approved/rejected counts.
- Reviewers see pending reviews, completed reviews, and approval/rejection counts.

---

## Core Features

### 1. Project & Task Management

- Create translation projects with source and target language configuration (English-Hausa).
- Add translation tasks individually with a text editor, or in bulk.
- Paginated task lists with status filtering and full-text search.
- Task assignment with optional due dates.
- Comment threads on individual tasks for translator-reviewer discussion.
- Notifications on assignment, approval, rejection, and new comments.

### 2. Flexible Content Ingestion

Three methods for adding translation tasks to a project:

| Method | Input | How It Works |
|--------|-------|--------------|
| **Single Task** | Manual text entry | Admin types or pastes content directly into a text field |
| **Bulk Upload** | `.txt` or `.csv` file | Each line (or CSV row) becomes a separate translation task |
| **Document Upload** | `.docx` or `.html` file | Paragraphs and headings are extracted as individual tasks, preserving document structure for reconstruction on export |

Document upload parses the file client-side, shows a preview of extracted segments with type badges (H1, H2, P, etc.), and lets the admin assign all segments to a translator/reviewer before uploading.

### 3. Translation Memory (TM)

Approved translations are automatically stored in translation memory. When a translator works on a new task:

- The system searches for similar previously translated content using fuzzy matching.
- Matches are displayed with similarity scores (exact match at 100%, partial matches down to 50%).
- Translators can apply a match with one click, pre-filling their translation.
- Usage counts track which translations are reused most frequently.

Translation memory reduces repetitive work and improves consistency across projects.

### 4. Glossary / Termbase

A shared, searchable dictionary of approved English-Hausa terminology:

- **Rich entries** — Each term includes: English term, Hausa translation, reviewed translation, definition, part of speech, usage example, domain classification, forbidden terms (discouraged alternatives), and notes.
- **Approval workflow** — Translators can propose new terms. Admins review and approve or leave them as proposed.
- **Inline lookup** — During translation, the glossary is searchable by word. Matching terms and their metadata appear alongside the editor.
- **Bulk import** — Admins can import glossary entries in bulk via JSON.
- **Inline editing** — Click any cell in the glossary table to edit it. Changes save automatically.

### 5. AI Translation Suggestions

Translators can request AI-powered translation suggestions for the current task. Suggestions serve as a starting point that the translator refines — not a replacement for human translation.

### 6. Multi-Format Export

Admins can export project translations in four formats:

| Format | Description |
|--------|-------------|
| **CSV** | Tabular spreadsheet with original content, translation, status, translator, and reviewer |
| **JSON** | Structured data for integration with other systems |
| **DOCX** | Word document with a formatted table of all translations |
| **Reconstructed Document** | Available for document-uploaded projects. Rebuilds the original file structure (headings, paragraphs) with translated content in place. Outputs as `.docx` or `.html` matching the source format |

Exports can be filtered by task status (approved only, all statuses, submitted, in-progress).

### 7. Activity Logging & Audit Trail

Every significant action is logged with timestamp, actor, and context:

- Project creation, task creation, task assignment
- Translation saves, submissions, approvals, rejections
- User creation, role changes, password changes, activation/deactivation

Admins access the full audit log with filtering by user and action type. This provides complete accountability and traceability for compliance-sensitive translation work.

### 8. Notification System

Users receive notifications for events relevant to them:

- **Task assigned** — When an admin assigns a task to a translator.
- **Task approved / rejected** — When a reviewer makes a decision on a submitted translation.
- **Comment added** — When someone comments on a task the user is involved with.

Notifications appear via a header bell icon with unread count, and can be marked as read individually or all at once.

### 9. User Management

Admins manage the team from a dedicated user management page:

- Create new users with role assignment.
- Activate or deactivate user accounts.
- Reset passwords on behalf of users.
- Change user roles.
- Users can change their own passwords from their profile.

---

## Technical Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL with Prisma ORM |
| Authentication | NextAuth v5 (credentials provider, session-based) |
| Styling | Tailwind CSS 4 |
| Validation | Zod schema validation |
| Document Parsing | Mammoth (DOCX to HTML), DOMParser (HTML) |
| Document Generation | docx.js (DOCX creation) |

### Security

- Password hashing with bcryptjs.
- Role-based access control enforced at every API endpoint.
- Input validation with Zod on all request bodies.
- Session-based authentication with secure cookie handling.
- Translators and reviewers can only access projects where they have assigned tasks.

---

## Current Scope

### Language Pair

Transleto currently supports **English to Hausa** and **Hausa to English** translation. The language model is extensible — adding new language pairs requires updating the `Language` enum and related UI labels.

### Document Support

Document upload currently handles **flat document structure**: paragraphs (`<p>`) and headings (`<h1>` through `<h6>`). Tables, lists, images, and other complex elements are not yet extracted as separate segments.

---

## Roadmap

### Near-Term Enhancements

- **Extended document support** — Parse and reconstruct tables, bulleted/numbered lists, and nested structures from DOCX and HTML files.
- **Additional language pairs** — Expand beyond English-Hausa to support French, Arabic, Yoruba, Igbo, and other languages relevant to target markets.
- **Translation memory improvements** — Segment-level TM matching (sub-sentence matches), configurable similarity thresholds, and TM import/export in TMX format for interoperability with other CAT tools.
- **Glossary import/export** — Support TBX (TermBase eXchange) format for glossary portability.
- **File format expansion** — Support for XLIFF, PO, and other localization-standard file formats.

### Medium-Term Goals

- **Real-time collaboration** — Live indicators showing which tasks are being worked on and by whom, preventing duplicate effort.
- **Analytics dashboard** — Translator productivity metrics, project completion trends, average review turnaround time, and TM hit rates.
- **Deadline management** — Calendar view of upcoming due dates, automated reminders for overdue tasks, and SLA tracking.
- **API access** — Public REST API for integration with external content management systems, enabling automated task creation and translation retrieval.
- **Webhook support** — Event-driven notifications to external systems (Slack, email, CMS) on task status changes.

### Long-Term Vision

- **Machine translation post-editing (MTPE) workflow** — Dedicated workflow where AI pre-translates content and human translators review and correct, with quality scoring to measure edit distance.
- **Multi-project glossaries** — Shared and project-specific glossaries with inheritance, allowing organization-wide terminology standards with project-level overrides.
- **Client portal** — Read-only access for external clients to track project progress, view approved translations, and download exports without needing a full user account.
- **Mobile-responsive translator interface** — Optimized translation editing experience for tablet and mobile devices, enabling translators to work from any device.
- **Plugin ecosystem** — Extensions for CMS platforms (WordPress, Drupal, Contentful) that push content to Transleto and pull back approved translations automatically.

---

## Target Users

| Segment | Use Case |
|---------|----------|
| **Translation agencies** | Manage multiple client projects with assigned translator and reviewer teams, track deadlines, and export deliverables |
| **NGOs and government bodies** | Translate institutional documents, policy papers, and public communications into local languages with quality assurance |
| **Educational institutions** | Translate academic materials, course content, and research papers with consistent terminology across departments |
| **Media organizations** | Translate news articles, press releases, and editorial content with fast turnaround and structured review |
| **Software companies** | Manage UI string translations and documentation localization with glossary enforcement for product terminology |

---

## Key Differentiators

1. **Integrated workflow** — Translation, review, terminology management, and translation memory in a single platform. No switching between tools.
2. **Document-aware** — Upload structured documents and get them back translated with formatting preserved. Not just a string translation tool.
3. **Quality gates** — Every translation passes through a defined review step before it is considered complete. Rejections include feedback for improvement.
4. **Full traceability** — Complete audit log of every action. Know who translated what, who reviewed it, and when.
5. **Terminology consistency** — Shared glossary with approval workflow ensures all translators use the same terms. Forbidden terms flag incorrect usage.
6. **Translation reuse** — Automatic translation memory means previously approved work is surfaced and reusable, reducing cost and improving consistency.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Configure environment
# Set DATABASE_URL in .env

# Initialize database
npm run db:migrate

# Start development server
npm run dev
```

### Default Access

After setup, create an initial admin user through the registration API or database seed:

```bash
npm run db:seed
```

---

*Transleto — Structured translation workflows for teams that care about quality.*
