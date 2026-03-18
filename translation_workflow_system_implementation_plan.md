# Translation Workflow System — Implementation Plan (MVP → Scalable System)

## Overview
This document outlines the step-by-step implementation plan for building a production-grade internal Translation Workflow System. The goal is to replace the current Google Docs workflow with a structured, trackable, and scalable application.

---

## 🎯 Objective
Build a functionality-first system that allows:
- Task assignment and tracking
- Translation input and submission
- Review and approval workflow
- Real-time visibility of progress

---

## 🧱 Phase 1: MVP (Core System)

### Features
- Authentication system
- Project creation
- Task creation (manual)
- Task assignment
- Translation input
- Submission for review
- Review (approve/reject)
- Status tracking
- Basic dashboard

---

## 🏗️ System Architecture

### Frontend
- Next.js (App Router)
- Tailwind CSS

### Backend
- Supabase
  - Authentication
  - Database
  - API

---

## 🗂️ Database Schema

### Users Table
- id (uuid)
- email (string)
- role (translator | reviewer)
- created_at (timestamp)

### Projects Table
- id (uuid)
- title (string)
- created_by (uuid)
- created_at (timestamp)

### Tasks Table
- id (uuid)
- project_id (uuid)
- original_content (text)
- translated_content (text)
- assigned_to (uuid)
- status (enum)
- updated_at (timestamp)

#### Status Enum
- not_started
- in_progress
- submitted
- approved
- rejected

---

## 📄 Application Pages

### 1. Login Page
- User authentication
- Redirect to dashboard

### 2. Dashboard
- List all projects
- Show counts:
  - Total tasks
  - Submitted tasks
  - Approved tasks

### 3. Project Page
- List tasks
- Create new task
- Assign task to user

### 4. Task Page

#### Translator View
- Original content (read-only)
- Translation input (textarea)
- Buttons:
  - Save
  - Submit for Review

#### Reviewer View
- Editable translation
- Buttons:
  - Approve
  - Reject

---

## 🧩 Development Steps

### Step 1: Project Setup
- Initialize Next.js project
- Install dependencies
- Setup Tailwind CSS

### Step 2: Supabase Setup
- Create project
- Setup authentication
- Create database tables

### Step 3: Authentication
- Login page
- Session management
- Protected routes

### Step 4: Projects
- Create project
- Fetch and display projects

### Step 5: Tasks
- Create tasks manually
- Assign tasks to users
- Display tasks per project

### Step 6: Translation Flow
- Translator updates content
- Save to database
- Change status to in_progress

### Step 7: Submission Flow
- Submit task
- Update status to submitted

### Step 8: Review Flow
- Reviewer views submitted tasks
- Approve or reject
- Update status accordingly

### Step 9: Dashboard
- Aggregate task data
- Display counts and summaries

---

## ⚠️ Constraints (Important)
- No document upload yet
- No rich text editor yet
- No offline mode yet
- No notifications yet

Focus strictly on functionality.

---

## 🚀 Phase 2 (Enhancements)
- Document upload
- Manual document splitting interface
- Side-by-side editor
- Commenting system
- In-app notifications

---

## 🔁 Phase 3 (Advanced)
- Offline support with sync
- Version history
- Activity logs
- Performance analytics

---

## 🌍 Phase 4 (Scalable Product Vision)
- Multi-team support
- External integrations (WhatsApp)
- AI-assisted translation

---

## 🧠 Development Principles
- Build small, test fast
- Prioritize usability over design
- Avoid over-engineering
- Ship working features early

---

## ✅ Success Criteria (MVP)
The system is successful if:
- Tasks can be assigned and tracked
- Translators can submit work
- Reviewer can approve/reject
- Progress is visible without manual checking

---

## 📌 Next Steps
1. Setup project
2. Configure backend
3. Build authentication
4. Implement core workflow

---

This plan serves as the foundation for building a scalable translation workflow system.

