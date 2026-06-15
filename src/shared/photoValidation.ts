export const MAX_PHOTO_SIZE_BYTES = 15 * 1024 * 1024;
export const MAX_STORED_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

export const SUPPORTED_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif'
]);

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export type UploaderNameValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

export function validatePhotoFile(file: File, options: { stored?: boolean } = {}): ValidationResult {
  if (!SUPPORTED_PHOTO_TYPES.has(file.type)) {
    return {
      ok: false,
      message: 'Upload a JPEG, PNG, WebP, HEIC, or AVIF image.'
    };
  }

  if (options.stored && file.size >= MAX_STORED_PHOTO_SIZE_BYTES) {
    return {
      ok: false,
      message: 'Compressed photos must be smaller than 2 MB.'
    };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      ok: false,
      message: 'Photos must be 15 MB or smaller.'
    };
  }

  return { ok: true };
}

export function normalizeUploaderName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return '';
  }

  if (normalized.length <= 35) {
    return normalized;
  }

  return `${normalized.slice(0, 32).trimEnd()}...`;
}

export function validateUploaderName(name: string): UploaderNameValidationResult {
  const normalized = normalizeUploaderName(name);

  if (!normalized) {
    return {
      ok: false,
      message: 'Enter your name before uploading photos.'
    };
  }

  return {
    ok: true,
    value: normalized
  };
}
