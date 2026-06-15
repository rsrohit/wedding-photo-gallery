# Upload Compression and Metadata Design

## Goal

Require a guest name for uploads, compress stored photos to less than 2 MB, name R2 objects using the uploader name and upload time, and preserve useful image metadata for display in the gallery.

## Approach

- Compress in the browser before upload using canvas/image encoding, targeting JPEG output under the 2 MB storage limit.
- Enforce the same 2 MB stored-file limit in the Worker before writing to R2.
- Extract metadata from the original selected image before compression. JPEG EXIF is parsed directly in the frontend; unsupported or unavailable metadata fields are stored as null.
- Send metadata as JSON in the multipart upload request.
- Generate the R2 object key in the Worker from the normalized uploader name, upload timestamp, a random id, and the stored image extension.
- Store metadata in D1 columns so the photo API can return it to the UI.

## User Experience

- Name is mandatory. Blank names block upload in the UI and are rejected by the Worker.
- Upload status tells guests that images are being optimized before upload.
- Photo cards and lightbox include an info button that opens a compact metadata panel.
- Metadata panel shows camera, captured date/time, location, original filename, stored filename, stored size, and content type when available.

## Constraints

- No paid image service is added.
- Existing R2/D1/Worker architecture remains in place.
- Existing approved photos continue to render even when their metadata columns are null.
- Compression depends on browser image decoding support. If the browser cannot decode a selected image for compression, upload fails with a clear message instead of storing an oversized original.
