# Wedding Photo Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working version of a GitHub Pages wedding photo gallery backed by Cloudflare Worker, R2, and D1.

**Architecture:** The static React/Vite frontend calls a Cloudflare Worker API. The Worker accepts guest photo uploads, stores files in R2, writes metadata to D1, and serves approved images back to the gallery. The data model includes an `events` table now so this single wedding can later grow into a multi-event platform.

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, Vitest, Cloudflare Workers, Cloudflare R2, Cloudflare D1, GitHub Pages.

---

## File Structure

- `package.json`: npm scripts and dependencies for the web app, tests, and Worker tooling.
- `index.html`: Vite entry HTML.
- `src/main.tsx`: React bootstrap.
- `src/App.tsx`: application shell, gallery, upload form, lightbox, and admin controls.
- `src/lib/api.ts`: typed frontend API client.
- `src/shared/photoValidation.ts`: file and display-name validation shared by tests.
- `src/styles.css`: Tailwind layers and custom UI refinements.
- `worker/src/index.ts`: Cloudflare Worker API routes.
- `worker/src/http.ts`: JSON, CORS, and path helpers for Worker tests.
- `migrations/0001_initial.sql`: D1 schema.
- `.github/workflows/deploy.yml`: GitHub Pages build and deploy workflow.
- `README.md`: local setup, Cloudflare setup, and deployment notes.

## Task 1: Project Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `.gitignore`
- Create: `index.html`

- [ ] **Step 1: Add configuration files**

Create npm scripts for `dev`, `build`, `test`, `worker:dev`, `worker:deploy`, and D1 migration commands. Configure Vite to use a GitHub Pages-compatible base path derived from `GITHUB_REPOSITORY`.

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and dependencies install successfully.

## Task 2: Validation and API Client With TDD

**Files:**
- Create: `src/shared/photoValidation.test.ts`
- Create: `src/lib/api.test.ts`
- Create: `src/shared/photoValidation.ts`
- Create: `src/lib/api.ts`

- [ ] **Step 1: Write failing tests**

Tests cover allowed image MIME types, max size rejection, uploader display-name cleanup, API URL construction, and upload error parsing.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test`

Expected: tests fail because `src/shared/photoValidation.ts` and `src/lib/api.ts` do not exist yet.

- [ ] **Step 3: Implement minimal validation and API helpers**

Implement `validatePhotoFile`, `normalizeUploaderName`, `buildApiUrl`, `fetchPhotos`, `uploadPhoto`, `hidePhoto`, and `deletePhoto`.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test`

Expected: all tests pass.

## Task 3: Worker Helpers and D1 Schema With TDD

**Files:**
- Create: `worker/src/http.test.ts`
- Create: `worker/src/http.ts`
- Create: `migrations/0001_initial.sql`

- [ ] **Step 1: Write failing Worker helper tests**

Tests cover route parsing, JSON response formatting, and CORS header generation.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test`

Expected: tests fail because `worker/src/http.ts` does not exist yet.

- [ ] **Step 3: Implement Worker helpers and schema**

Implement `jsonResponse`, `errorResponse`, `withCorsHeaders`, `parseEventPhotoPath`, and D1 schema for `events` and `photos`.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm test`

Expected: all tests pass.

## Task 4: Worker API

**Files:**
- Create: `worker/src/index.ts`
- Create: `wrangler.toml.example`

- [ ] **Step 1: Implement Worker routes**

Implement health, list, upload, file serving, hide, and delete routes using R2 and D1 bindings. Validate file type, max size, event slug, and admin token.

- [ ] **Step 2: Type-check Worker code**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

## Task 5: Frontend Application

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Implement React UI**

Build the gallery, upload form, lightbox, admin token field, and empty/error/loading states.

- [ ] **Step 2: Build the frontend**

Run: `npm run build`

Expected: Vite creates `dist/`.

## Task 6: Deployment Documentation

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

- [ ] **Step 1: Add GitHub Pages workflow**

Configure Actions to install dependencies, build Vite, and publish `dist/` to GitHub Pages.

- [ ] **Step 2: Document setup**

Document GitHub Pages, Cloudflare R2, D1, Worker deploy, required environment variables, and expected costs.

## Self-Review

- Spec coverage: all MVP guest, admin, storage, metadata, and deployment requirements map to tasks above.
- Placeholder scan: no TBD or incomplete requirements remain.
- Type consistency: frontend tests, API client names, Worker route helpers, and schema names are consistent.
