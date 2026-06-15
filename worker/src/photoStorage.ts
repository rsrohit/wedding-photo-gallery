import { PhotoMetadata, normalizePhotoMetadata } from '../../src/shared/photoMetadata';

export type PhotoObjectKeyOptions = {
  eventSlug: string;
  uploaderName: string;
  uploadedAt: string;
  photoId: string;
  originalName: string;
  contentType: string;
};

export type BuildPhotoMetadataOptions = {
  eventSlug: string;
  photoId: string;
  uploaderName: string;
  originalName: string;
  storedName: string;
  metadata: PhotoMetadata;
};

export function createPhotoObjectKey(options: PhotoObjectKeyOptions): string {
  const uploaderSlug = slugify(options.uploaderName) || 'guest';
  const timestamp = compactTimestamp(options.uploadedAt);
  const idPart = slugify(options.photoId).slice(0, 8) || crypto.randomUUID().slice(0, 8);
  const extension = extensionForContentType(options.contentType, options.originalName);

  return `${options.eventSlug}/${uploaderSlug}-${timestamp}-${idPart}.${extension}`;
}

export function parsePhotoMetadataPayload(value: FormDataEntryValue | null): PhotoMetadata {
  if (typeof value !== 'string' || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as PhotoMetadata;
    return normalizePhotoMetadata(parsed);
  } catch {
    return {};
  }
}

export function buildPhotoMetadata(options: BuildPhotoMetadataOptions): Record<string, string> {
  const metadata = normalizePhotoMetadata(options.metadata);
  const customMetadata: Record<string, string> = {
    eventSlug: options.eventSlug,
    photoId: options.photoId,
    uploaderName: options.uploaderName,
    originalName: options.originalName,
    storedName: options.storedName
  };

  if (metadata.cameraMake) {
    customMetadata.cameraMake = metadata.cameraMake;
  }

  if (metadata.cameraModel) {
    customMetadata.cameraModel = metadata.cameraModel;
  }

  if (metadata.capturedAt) {
    customMetadata.capturedAt = metadata.capturedAt;
  }

  if (metadata.latitude !== undefined) {
    customMetadata.latitude = String(metadata.latitude);
  }

  if (metadata.longitude !== undefined) {
    customMetadata.longitude = String(metadata.longitude);
  }

  return customMetadata;
}

export function getStoredNameFromKey(r2Key: string): string {
  return r2Key.split('/').pop() || r2Key;
}

function compactTimestamp(value: string): string {
  const date = new Date(value);
  const iso = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();

  return iso.replace(/[-:.]/g, '');
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function extensionForContentType(contentType: string, originalName: string): string {
  if (contentType === 'image/jpeg') {
    return 'jpg';
  }

  if (contentType === 'image/png') {
    return 'png';
  }

  if (contentType === 'image/webp') {
    return 'webp';
  }

  if (contentType === 'image/avif') {
    return 'avif';
  }

  const match = originalName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || 'jpg';
}
