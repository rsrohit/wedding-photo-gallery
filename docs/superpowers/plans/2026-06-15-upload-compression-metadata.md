# Upload Compression and Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mandatory uploader names, browser-side photo compression under 2 MB, metadata capture, and R2 keys based on uploader name and upload time.

**Architecture:** The frontend validates the name, extracts EXIF metadata, compresses each selected image to a JPEG below the Worker storage limit, and submits metadata with the compressed file. The Worker validates the same constraints, generates the R2 key, stores metadata in D1, and returns metadata in photo DTOs.

**Tech Stack:** React, TypeScript, Vite, Vitest, Cloudflare Workers, R2, D1.

---

## Tasks

- [x] Add failing tests for uploader-name validation, metadata parsing, compression helpers, and Worker storage naming.
- [x] Implement shared validation constants and metadata parsing helpers.
- [x] Implement client-side compression and upload preparation.
- [x] Add D1 metadata migration.
- [x] Update Worker upload/list/file queries, R2 key naming, and DTO metadata output.
- [x] Update React UI for mandatory name, compression status, and metadata info panels.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [ ] Deploy Worker and GitHub Pages.
- [ ] Verify upload and metadata display live.
