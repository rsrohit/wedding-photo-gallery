# Carousel Lightbox Views Design

## Goal

Replace the main gallery area with a cinematic carousel layout and track photo views when guests open photos in the lightbox.

## Approved UI Direction

Use the Option B layout selected during visual review:

- Feature the newest photo as a large "Recently Uploaded" hero.
- Show a horizontal "Most Viewed" carousel below the hero.
- Show a horizontal "All Photos" carousel below Most Viewed.
- Keep the existing futuristic glass visual language, lightbox, download action, admin actions, and metadata info dialog.

## View Tracking

- Add persisted `view_count` and `last_viewed_at` fields to photos.
- Existing photos start with `0` views.
- Increment `view_count` when a guest opens a photo in the lightbox.
- Opening a next or previous photo inside the lightbox also increments that photo's view count.
- Sort "Most Viewed" by `view_count` descending, then newest first for ties.

## Lightbox Navigation

- Add previous and next arrow buttons to the lightbox.
- Previous/next loops from the first photo to the last and from the last photo to the first.
- Keyboard support:
  - Left arrow: previous photo
  - Right arrow: next photo
  - Escape: close lightbox
- Mobile controls must remain large enough to tap and avoid covering the photo unnecessarily.

## Backend/API

- Add `POST /api/events/:eventSlug/photos/:photoId/view`.
- The endpoint validates event/photo ids, increments the view count for approved photos, and returns the updated count.
- The photo list API returns `viewCount` and `lastViewedAt`.

## Verification

- Add unit tests for carousel sorting and lightbox adjacency.
- Add API client tests for the view tracking call.
- Add Worker route helper tests for the view endpoint path.
- Run full tests and production build.
- Verify live UI after deploying D1 migration, Worker, and GitHub Pages.
