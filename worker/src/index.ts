import {
  MAX_STORED_PHOTO_SIZE_BYTES,
  SUPPORTED_PHOTO_TYPES,
  validateUploaderName
} from '../../src/shared/photoValidation';
import {
  errorResponse,
  jsonResponse,
  parseEventPhotoPath,
  parseEventPhotoViewPath,
  withCorsHeaders
} from './http';
import {
  buildPhotoMetadata,
  createPhotoObjectKey,
  getStoredNameFromKey,
  parsePhotoMetadataPayload
} from './photoStorage';

type Env = {
  PHOTOS_BUCKET: R2Bucket;
  WEDDING_DB: D1Database;
  ADMIN_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
  EVENT_TITLE?: string;
};

type PhotoRow = {
  id: string;
  event_slug: string;
  r2_key: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  original_size_bytes: number | null;
  uploader_name: string;
  created_at: string;
  stored_name: string | null;
  camera_make: string | null;
  camera_model: string | null;
  captured_at: string | null;
  latitude: number | null;
  longitude: number | null;
  view_count: number;
  last_viewed_at: string | null;
};

const DEFAULT_EVENT_TITLE = 'Wedding Photo Gallery';

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  }
};

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: withCorsHeaders(new Headers(), origin, allowedOrigins)
    });
  }

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return jsonResponse({ ok: true }, 200, origin, allowedOrigins);
    }

    const eventPhotosMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/photos$/);
    if (eventPhotosMatch && request.method === 'GET') {
      return listPhotos(request, env, decodeURIComponent(eventPhotosMatch[1]), origin, allowedOrigins);
    }

    if (eventPhotosMatch && request.method === 'POST') {
      return uploadPhoto(request, env, decodeURIComponent(eventPhotosMatch[1]), origin, allowedOrigins);
    }

    const filePath = parseEventPhotoPath(url.pathname);
    if (filePath && request.method === 'GET') {
      return servePhotoFile(request, env, filePath.eventSlug, filePath.photoId, origin, allowedOrigins);
    }

    const viewPath = parseEventPhotoViewPath(url.pathname);
    if (viewPath && request.method === 'POST') {
      return recordPhotoView(env, viewPath.eventSlug, viewPath.photoId, origin, allowedOrigins);
    }

    const hideMatch = url.pathname.match(/^\/api\/admin\/events\/([^/]+)\/photos\/([^/]+)\/hide$/);
    if (hideMatch && request.method === 'POST') {
      return hidePhoto(request, env, decodeURIComponent(hideMatch[1]), decodeURIComponent(hideMatch[2]), origin, allowedOrigins);
    }

    const deleteMatch = url.pathname.match(/^\/api\/admin\/events\/([^/]+)\/photos\/([^/]+)$/);
    if (deleteMatch && request.method === 'DELETE') {
      return deletePhoto(request, env, decodeURIComponent(deleteMatch[1]), decodeURIComponent(deleteMatch[2]), origin, allowedOrigins);
    }

    return errorResponse('Route not found.', 404, origin, allowedOrigins);
  } catch (error) {
    console.error(error);
    return errorResponse('Unexpected server error.', 500, origin, allowedOrigins);
  }
}

async function listPhotos(
  request: Request,
  env: Env,
  eventSlug: string,
  origin: string | null,
  allowedOrigins: string[]
): Promise<Response> {
  const slugError = validateEventSlug(eventSlug);
  if (slugError) {
    return errorResponse(slugError, 400, origin, allowedOrigins);
  }

  const { results } = await env.WEDDING_DB.prepare(
    `SELECT id, event_slug, r2_key, original_name, stored_name, content_type, size_bytes,
            original_size_bytes, uploader_name, created_at, camera_make, camera_model,
            captured_at, latitude, longitude, view_count, last_viewed_at
     FROM photos
     WHERE event_slug = ? AND status = 'approved'
     ORDER BY created_at DESC`
  )
    .bind(eventSlug)
    .all<PhotoRow>();

  return jsonResponse(
    {
      photos: results.map((row) => toPhotoDto(request, row))
    },
    200,
    origin,
    allowedOrigins
  );
}

async function uploadPhoto(
  request: Request,
  env: Env,
  eventSlug: string,
  origin: string | null,
  allowedOrigins: string[]
): Promise<Response> {
  const slugError = validateEventSlug(eventSlug);
  if (slugError) {
    return errorResponse(slugError, 400, origin, allowedOrigins);
  }

  const formData = await request.formData();
  const file = formData.get('photo');
  const uploaderNameResult = validateUploaderName(String(formData.get('uploaderName') || ''));

  if (!(file instanceof File)) {
    return errorResponse('Choose a photo to upload.', 400, origin, allowedOrigins);
  }

  if (!uploaderNameResult.ok) {
    return errorResponse(uploaderNameResult.message, 400, origin, allowedOrigins);
  }

  if (!SUPPORTED_PHOTO_TYPES.has(file.type)) {
    return errorResponse('Upload a JPEG, PNG, WebP, HEIC, or AVIF image.', 415, origin, allowedOrigins);
  }

  if (file.size >= MAX_STORED_PHOTO_SIZE_BYTES) {
    return errorResponse('Compressed photos must be smaller than 2 MB.', 413, origin, allowedOrigins);
  }

  const photoId = crypto.randomUUID();
  const uploaderName = uploaderNameResult.value;
  const originalName = sanitizeFileName(String(formData.get('originalName') || file.name || 'photo.jpg'));
  const metadata = parsePhotoMetadataPayload(formData.get('photoMetadata'));
  const originalSizeBytes = parsePositiveInteger(String(formData.get('originalSizeBytes') || ''));
  const createdAt = new Date().toISOString();
  const r2Key = createPhotoObjectKey({
    eventSlug,
    uploaderName,
    uploadedAt: createdAt,
    photoId,
    originalName,
    contentType: file.type
  });
  const storedName = getStoredNameFromKey(r2Key);

  await env.PHOTOS_BUCKET.put(r2Key, file.stream(), {
    httpMetadata: {
      contentType: file.type
    },
    customMetadata: buildPhotoMetadata({
      eventSlug,
      photoId,
      uploaderName,
      originalName,
      storedName,
      metadata
    })
  });

  await env.WEDDING_DB.prepare(
    `INSERT INTO events (id, slug, title)
     VALUES (?, ?, ?)
     ON CONFLICT(slug) DO NOTHING`
  )
    .bind(eventSlug, eventSlug, env.EVENT_TITLE || DEFAULT_EVENT_TITLE)
    .run();

  await env.WEDDING_DB.prepare(
    `INSERT INTO photos
      (id, event_slug, r2_key, original_name, stored_name, content_type, size_bytes,
       original_size_bytes, uploader_name, status, created_at, camera_make, camera_model,
       captured_at, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      photoId,
      eventSlug,
      r2Key,
      originalName,
      storedName,
      file.type,
      file.size,
      originalSizeBytes,
      uploaderName,
      createdAt,
      metadata.cameraMake || null,
      metadata.cameraModel || null,
      metadata.capturedAt || null,
      metadata.latitude ?? null,
      metadata.longitude ?? null
    )
    .run();

  return jsonResponse(
    {
      photo: toPhotoDto(request, {
        id: photoId,
        event_slug: eventSlug,
        r2_key: r2Key,
        original_name: originalName,
        stored_name: storedName,
        content_type: file.type,
        size_bytes: file.size,
        original_size_bytes: originalSizeBytes,
        uploader_name: uploaderName,
        created_at: createdAt,
        camera_make: metadata.cameraMake || null,
        camera_model: metadata.cameraModel || null,
        captured_at: metadata.capturedAt || null,
        latitude: metadata.latitude ?? null,
        longitude: metadata.longitude ?? null,
        view_count: 0,
        last_viewed_at: null
      })
    },
    201,
    origin,
    allowedOrigins
  );
}

async function servePhotoFile(
  request: Request,
  env: Env,
  eventSlug: string,
  photoId: string,
  origin: string | null,
  allowedOrigins: string[]
): Promise<Response> {
  const row = await env.WEDDING_DB.prepare(
    `SELECT id, event_slug, r2_key, original_name, stored_name, content_type, size_bytes,
            original_size_bytes, uploader_name, created_at, camera_make, camera_model,
            captured_at, latitude, longitude, view_count, last_viewed_at
     FROM photos
     WHERE event_slug = ? AND id = ? AND status = 'approved'`
  )
    .bind(eventSlug, photoId)
    .first<PhotoRow>();

  if (!row) {
    return errorResponse('Photo not found.', 404, origin, allowedOrigins);
  }

  const object = await env.PHOTOS_BUCKET.get(row.r2_key);
  if (!object) {
    return errorResponse('Photo file not found.', 404, origin, allowedOrigins);
  }

  const url = new URL(request.url);
  const headers = withCorsHeaders(new Headers(), origin, allowedOrigins);
  headers.set('content-type', row.content_type);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  if (url.searchParams.get('download') === '1') {
    headers.set('content-disposition', `attachment; filename="${row.original_name.replaceAll('"', '')}"`);
  }

  return new Response(object.body, { headers });
}

async function recordPhotoView(
  env: Env,
  eventSlug: string,
  photoId: string,
  origin: string | null,
  allowedOrigins: string[]
): Promise<Response> {
  const slugError = validateEventSlug(eventSlug);
  if (slugError) {
    return errorResponse(slugError, 400, origin, allowedOrigins);
  }

  const viewedAt = new Date().toISOString();
  await env.WEDDING_DB.prepare(
    `UPDATE photos
     SET view_count = view_count + 1,
         last_viewed_at = ?
     WHERE event_slug = ? AND id = ? AND status = 'approved'`
  )
    .bind(viewedAt, eventSlug, photoId)
    .run();

  const row = await env.WEDDING_DB.prepare(
    `SELECT view_count, last_viewed_at
     FROM photos
     WHERE event_slug = ? AND id = ? AND status = 'approved'`
  )
    .bind(eventSlug, photoId)
    .first<{ view_count: number; last_viewed_at: string }>();

  if (!row) {
    return errorResponse('Photo not found.', 404, origin, allowedOrigins);
  }

  return jsonResponse(
    {
      viewCount: row.view_count,
      lastViewedAt: row.last_viewed_at
    },
    200,
    origin,
    allowedOrigins
  );
}

async function hidePhoto(
  request: Request,
  env: Env,
  eventSlug: string,
  photoId: string,
  origin: string | null,
  allowedOrigins: string[]
): Promise<Response> {
  const authError = requireAdmin(request, env);
  if (authError) {
    return errorResponse(authError.message, authError.status, origin, allowedOrigins);
  }

  await env.WEDDING_DB.prepare(
    `UPDATE photos
     SET status = 'hidden'
     WHERE event_slug = ? AND id = ? AND status != 'deleted'`
  )
    .bind(eventSlug, photoId)
    .run();

  return jsonResponse({ ok: true }, 200, origin, allowedOrigins);
}

async function deletePhoto(
  request: Request,
  env: Env,
  eventSlug: string,
  photoId: string,
  origin: string | null,
  allowedOrigins: string[]
): Promise<Response> {
  const authError = requireAdmin(request, env);
  if (authError) {
    return errorResponse(authError.message, authError.status, origin, allowedOrigins);
  }

  const row = await env.WEDDING_DB.prepare(
    `SELECT r2_key
     FROM photos
     WHERE event_slug = ? AND id = ? AND status != 'deleted'`
  )
    .bind(eventSlug, photoId)
    .first<{ r2_key: string }>();

  if (!row) {
    return errorResponse('Photo not found.', 404, origin, allowedOrigins);
  }

  await env.PHOTOS_BUCKET.delete(row.r2_key);
  await env.WEDDING_DB.prepare(
    `UPDATE photos
     SET status = 'deleted'
     WHERE event_slug = ? AND id = ?`
  )
    .bind(eventSlug, photoId)
    .run();

  return jsonResponse({ ok: true }, 200, origin, allowedOrigins);
}

function toPhotoDto(request: Request, row: PhotoRow) {
  const baseUrl = new URL(request.url).origin;
  const filePath = `/api/events/${encodeURIComponent(row.event_slug)}/photos/${encodeURIComponent(row.id)}/file`;

  return {
    id: row.id,
    eventSlug: row.event_slug,
    imageUrl: `${baseUrl}${filePath}`,
    downloadUrl: `${baseUrl}${filePath}?download=1`,
    originalName: row.original_name,
    storedName: row.stored_name || getStoredNameFromKey(row.r2_key),
    uploaderName: row.uploader_name,
    sizeBytes: row.size_bytes,
    originalSizeBytes: row.original_size_bytes,
    contentType: row.content_type,
    createdAt: row.created_at,
    viewCount: row.view_count || 0,
    lastViewedAt: row.last_viewed_at,
    metadata: {
      ...(row.camera_make ? { cameraMake: row.camera_make } : {}),
      ...(row.camera_model ? { cameraModel: row.camera_model } : {}),
      ...(row.captured_at ? { capturedAt: row.captured_at } : {}),
      ...(row.latitude !== null ? { latitude: row.latitude } : {}),
      ...(row.longitude !== null ? { longitude: row.longitude } : {})
    }
  };
}

function parseAllowedOrigins(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function validateEventSlug(slug: string): string | null {
  if (!/^[a-z0-9-]{2,64}$/.test(slug)) {
    return 'Event link is invalid.';
  }

  return null;
}

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return cleaned || 'photo.jpg';
}

function requireAdmin(request: Request, env: Env): { message: string; status: number } | null {
  if (!env.ADMIN_TOKEN) {
    return { message: 'Admin actions are not configured.', status: 503 };
  }

  if (request.headers.get('x-admin-token') !== env.ADMIN_TOKEN) {
    return { message: 'Invalid admin token.', status: 401 };
  }

  return null;
}

function parsePositiveInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
