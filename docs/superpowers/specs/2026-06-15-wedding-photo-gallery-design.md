# Wedding Photo Gallery Design

## Goal

Build a low-cost wedding photo sharing website where guests can open a GitHub Pages URL, upload photos without creating an account, and view photos uploaded by anyone with the link. The first version serves one wedding, while keeping the data model ready for future multi-event use.

## Product Scope

The MVP includes a public gallery, guest upload flow, photo preview, individual downloads, and a private admin moderation surface. Guests can upload anonymously with an optional display name. Google sign-in is not required for the MVP; it can be added later for identity only. Google Drive is not primary storage; it remains an optional post-wedding export or backup target.

## Architecture

The frontend is a static React/Vite application deployed with GitHub Pages. Dynamic operations go through a Cloudflare Worker hosted on a `workers.dev` URL. The Worker validates uploads, stores image files in Cloudflare R2, writes photo metadata to Cloudflare D1, and serves gallery photo URLs back to the frontend.

```text
Guest browser
-> GitHub Pages static app
-> Cloudflare Worker API
-> Cloudflare R2 photo storage
-> Cloudflare D1 metadata database
```

The repo keeps a single `events` table from day one. The initial deployment uses one event slug, but future platform work can add event creation, event-specific admins, branding, invite codes, billing, and custom domains without replacing the storage or metadata model.

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Static hosting: GitHub Pages
- Backend API: Cloudflare Workers
- File storage: Cloudflare R2
- Metadata database: Cloudflare D1
- Testing: Vitest
- Optional future identity: Google Sign-In
- Optional future backup: Google Drive API export

## Guest Features

- Public gallery page for one wedding event.
- Upload photos without login.
- Optional uploader name.
- Image-only file validation.
- Max upload size enforcement.
- Upload progress and error states.
- Gallery grid sorted newest first.
- Lightbox preview.
- Individual image download.
- Mobile-first layout.

## Admin Features

- Admin token protected view.
- Hide/delete uploaded photos.
- View upload time and uploader name.
- Keep photo status in metadata so moderation can become stricter later.

## Data Model

`events`

- `id`: event identifier.
- `slug`: public event slug.
- `title`: display title.
- `created_at`: creation timestamp.

`photos`

- `id`: photo identifier.
- `event_slug`: event slug foreign key.
- `r2_key`: object key in R2.
- `original_name`: original file name.
- `content_type`: uploaded MIME type.
- `size_bytes`: file size.
- `uploader_name`: optional display name.
- `status`: `approved`, `hidden`, or `deleted`.
- `created_at`: upload timestamp.

## API Surface

- `GET /api/health`: health check.
- `GET /api/events/:slug/photos`: list approved photos.
- `POST /api/events/:slug/photos`: upload one photo using multipart form data.
- `GET /api/events/:slug/photos/:id/file`: serve the stored image.
- `POST /api/admin/events/:slug/photos/:id/hide`: hide a photo.
- `DELETE /api/admin/events/:slug/photos/:id`: mark a photo deleted and remove the R2 object.

## Error Handling

The Worker rejects missing files, non-image files, oversized files, empty event slugs, and invalid admin tokens with structured JSON errors. The frontend displays concise upload and loading failures without exposing implementation details.

## Cost Controls

- GitHub Pages hosting: $0.
- Cloudflare R2 uses free internet egress and low storage pricing.
- Worker and D1 should stay in free tier for normal wedding traffic.
- Max upload size prevents accidental large video uploads.
- Public gallery serves files through the Worker so the bucket is not publicly listable.

## Verification

Core validation and API helper behavior are covered with Vitest unit tests. The production build verifies TypeScript and Vite output. Cloudflare deployment remains configuration-dependent because the user must create the Cloudflare account resources and insert the D1 database ID.
