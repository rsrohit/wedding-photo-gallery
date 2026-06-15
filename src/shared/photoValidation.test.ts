import { describe, expect, it } from 'vitest';
import {
  MAX_PHOTO_SIZE_BYTES,
  normalizeUploaderName,
  validatePhotoFile
} from './photoValidation';

function imageFile(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('validatePhotoFile', () => {
  it('accepts supported image files below the max size', () => {
    const result = validatePhotoFile(imageFile('ceremony.jpg', 'image/jpeg'));

    expect(result.ok).toBe(true);
  });

  it('rejects files that are too large', () => {
    const result = validatePhotoFile(
      imageFile('huge.jpg', 'image/jpeg', MAX_PHOTO_SIZE_BYTES + 1)
    );

    expect(result).toEqual({
      ok: false,
      message: 'Photos must be 15 MB or smaller.'
    });
  });

  it('rejects unsupported file types', () => {
    const result = validatePhotoFile(new File(['not a photo'], 'notes.txt', { type: 'text/plain' }));

    expect(result).toEqual({
      ok: false,
      message: 'Upload a JPEG, PNG, WebP, HEIC, or AVIF image.'
    });
  });
});

describe('normalizeUploaderName', () => {
  it('trims spaces and collapses repeated whitespace', () => {
    expect(normalizeUploaderName('  Asha    Mehta  ')).toBe('Asha Mehta');
  });

  it('uses Guest for empty names', () => {
    expect(normalizeUploaderName('   ')).toBe('Guest');
  });

  it('caps very long names without cutting mid-word when possible', () => {
    expect(normalizeUploaderName('A very very very very very very long family display name')).toBe(
      'A very very very very very very...'
    );
  });
});
