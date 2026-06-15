import { PhotoMetadata } from '../shared/photoMetadata';

export type Photo = {
  id: string;
  eventSlug: string;
  imageUrl: string;
  downloadUrl: string;
  originalName: string;
  storedName: string;
  uploaderName: string;
  sizeBytes: number;
  originalSizeBytes: number | null;
  contentType: string;
  createdAt: string;
  viewCount: number;
  lastViewedAt: string | null;
  metadata: PhotoMetadata;
};

type ApiOptions = {
  apiBaseUrl: string;
  eventSlug: string;
};

type PhotoMutationOptions = ApiOptions & {
  photoId: string;
  adminToken: string;
};

type PhotoViewOptions = ApiOptions & {
  photoId: string;
};

export type PhotoViewResult = {
  viewCount: number;
  lastViewedAt: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function buildApiUrl(apiBaseUrl: string, path: string): string {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${base}${normalizedPath}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let message = 'Something went wrong. Please try again.';

  try {
    const body = (await response.json()) as { error?: string };
    message = body.error || message;
  } catch {
    // Keep the generic message when the backend returns non-JSON.
  }

  throw new ApiError(message, response.status);
}

export async function fetchPhotos(options: ApiOptions): Promise<Photo[]> {
  const response = await fetch(
    buildApiUrl(options.apiBaseUrl, `/api/events/${encodeURIComponent(options.eventSlug)}/photos`)
  );
  const payload = await parseResponse<{ photos: Photo[] }>(response);

  return payload.photos;
}

export async function uploadPhoto(
  options: ApiOptions & {
    file: File;
    uploaderName: string;
    originalName?: string;
    originalSizeBytes?: number;
    metadata?: PhotoMetadata;
  }
): Promise<Photo> {
  const formData = new FormData();
  formData.set('photo', options.file);
  formData.set('uploaderName', options.uploaderName);
  formData.set('originalName', options.originalName || options.file.name);
  if (options.originalSizeBytes) {
    formData.set('originalSizeBytes', String(options.originalSizeBytes));
  }
  formData.set('photoMetadata', JSON.stringify(options.metadata || {}));

  const response = await fetch(
    buildApiUrl(options.apiBaseUrl, `/api/events/${encodeURIComponent(options.eventSlug)}/photos`),
    {
      method: 'POST',
      body: formData
    }
  );
  const payload = await parseResponse<{ photo: Photo }>(response);

  return payload.photo;
}

export async function hidePhoto(options: PhotoMutationOptions): Promise<void> {
  const response = await fetch(
    buildApiUrl(
      options.apiBaseUrl,
      `/api/admin/events/${encodeURIComponent(options.eventSlug)}/photos/${encodeURIComponent(
        options.photoId
      )}/hide`
    ),
    {
      method: 'POST',
      headers: {
        'x-admin-token': options.adminToken
      }
    }
  );

  await parseResponse<{ ok: true }>(response);
}

export async function deletePhoto(options: PhotoMutationOptions): Promise<void> {
  const response = await fetch(
    buildApiUrl(
      options.apiBaseUrl,
      `/api/admin/events/${encodeURIComponent(options.eventSlug)}/photos/${encodeURIComponent(
        options.photoId
      )}`
    ),
    {
      method: 'DELETE',
      headers: {
        'x-admin-token': options.adminToken
      }
    }
  );

  await parseResponse<{ ok: true }>(response);
}

export async function recordPhotoView(options: PhotoViewOptions): Promise<PhotoViewResult> {
  const response = await fetch(
    buildApiUrl(
      options.apiBaseUrl,
      `/api/events/${encodeURIComponent(options.eventSlug)}/photos/${encodeURIComponent(
        options.photoId
      )}/view`
    ),
    {
      method: 'POST'
    }
  );

  return parseResponse<PhotoViewResult>(response);
}
