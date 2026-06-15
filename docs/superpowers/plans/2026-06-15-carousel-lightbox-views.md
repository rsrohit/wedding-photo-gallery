# Carousel Lightbox Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the selected hero-plus-carousel gallery, persisted photo view tracking, and next/previous lightbox navigation.

**Architecture:** Add small shared collection helpers for sorting and adjacency, then wire React to render a recent hero, most-viewed carousel, and all-photos carousel. Add D1 columns and a Worker view endpoint so the frontend records a view whenever a lightbox photo becomes active.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Cloudflare Workers, D1, R2, GitHub Pages.

---

## Files

- Create `src/shared/photoCollections.ts`: pure helpers for recent photos, most-viewed sorting, and looped previous/next lookup.
- Create `src/shared/photoCollections.test.ts`: unit tests for carousel sorting and adjacency behavior.
- Modify `src/lib/api.ts` and `src/lib/api.test.ts`: add `viewCount`, `lastViewedAt`, and `recordPhotoView`.
- Modify `worker/src/http.ts` and `worker/src/http.test.ts`: parse the photo view endpoint path.
- Modify `worker/src/index.ts`: add view count fields to queries/DTOs and implement the view endpoint.
- Create `migrations/0003_photo_views.sql`: add `view_count` and `last_viewed_at`.
- Modify `src/App.tsx`: replace the gallery/constellation area with hero recent, Most Viewed carousel, All Photos carousel, and navigable lightbox.
- Modify `src/styles.css`: add carousel rail, hero, and lightbox navigation styles if Tailwind classes are not sufficient.
- Modify `.gitignore`: ignore visual companion scratch files.

## Tasks

- [x] Write failing tests for `getRecentlyUploadedPhotos`, `getMostViewedPhotos`, and `getAdjacentPhoto`.
- [x] Implement `src/shared/photoCollections.ts`.
- [x] Write failing API client test for `recordPhotoView`.
- [x] Implement `recordPhotoView` and photo view fields in `src/lib/api.ts`.
- [x] Write failing Worker route helper test for `/api/events/:event/photos/:photoId/view`.
- [x] Implement route parsing and Worker view endpoint.
- [x] Add D1 migration for `view_count` and `last_viewed_at`.
- [x] Update `src/App.tsx` to render Option B hero plus carousels.
- [x] Add lightbox previous/next buttons and keyboard navigation.
- [x] Run `npm test`.
- [x] Run `npm run build`.
- [ ] Apply D1 migration, deploy Worker, push GitHub Pages.
- [ ] Verify live UI, metadata dialog, carousels, and view endpoint.
