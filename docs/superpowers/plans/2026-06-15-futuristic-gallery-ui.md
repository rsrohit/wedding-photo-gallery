# Futuristic Gallery UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the gallery to an Aurora Glass interface with a Memory Constellation alternate view.

**Architecture:** Keep all backend and API logic unchanged. Add a small typed UI view-mode helper, then refactor `src/App.tsx` markup/classes and `src/styles.css` animation utilities to support the new visual direction.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Vite.

---

## Tasks

- [x] Add `src/shared/galleryView.ts` and `src/shared/galleryView.test.ts` for gallery/constellation mode validation and labels.
- [x] Update `src/App.tsx` with Aurora Glass shell, stats, upload command panel, segmented view control, constellation canvas-like view, and refreshed lightbox.
- [x] Update `src/styles.css` with aurora background, glass panel, constellation, and reduced-motion-safe animations.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [x] Verify local UI in browser at desktop and mobile sizes.
- [ ] Commit and push.
