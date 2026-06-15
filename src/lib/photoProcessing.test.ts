import { describe, expect, it } from 'vitest';
import {
  createCompressedFileName,
  createStoredImageFile,
  shouldUseCompressedBlob
} from './photoProcessing';

describe('createCompressedFileName', () => {
  it('uses the original base name with a jpg extension', () => {
    expect(createCompressedFileName('Ceremony Portrait.HEIC')).toBe('ceremony-portrait.jpg');
  });
});

describe('shouldUseCompressedBlob', () => {
  it('uses a compressed blob when it is below the storage limit and smaller than the original', () => {
    expect(shouldUseCompressedBlob({ originalSize: 4_000_000, compressedSize: 1_800_000 })).toBe(true);
  });

  it('rejects a compressed blob above the storage limit', () => {
    expect(shouldUseCompressedBlob({ originalSize: 4_000_000, compressedSize: 2_200_000 })).toBe(false);
  });
});

describe('createStoredImageFile', () => {
  it('wraps a compressed blob as a JPEG File', () => {
    const file = createStoredImageFile(new Blob(['jpeg'], { type: 'image/jpeg' }), 'My Photo.PNG');

    expect(file.name).toBe('my-photo.jpg');
    expect(file.type).toBe('image/jpeg');
  });
});
