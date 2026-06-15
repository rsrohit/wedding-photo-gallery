import { describe, expect, it } from 'vitest';
import { buildPhotoDetailRows } from './photoDetails';

describe('buildPhotoDetailRows', () => {
  it('includes camera, capture time, location, filenames, and sizes when available', () => {
    expect(
      buildPhotoDetailRows({
        originalName: 'Ceremony.HEIC',
        storedName: 'asha-20260615T083010000Z-photo-1.jpg',
        sizeBytes: 1_500_000,
        originalSizeBytes: 4_500_000,
        contentType: 'image/jpeg',
        metadata: {
          cameraMake: 'Canon',
          cameraModel: 'EOS R6',
          capturedAt: '2024-12-01T10:20:30',
          latitude: 18.5204,
          longitude: 73.8567
        }
      })
    ).toEqual([
      { label: 'Camera', value: 'Canon EOS R6' },
      { label: 'Captured', value: 'Dec 1, 2024, 10:20 AM' },
      { label: 'Location', value: '18.5204, 73.8567' },
      { label: 'Original file', value: 'Ceremony.HEIC' },
      { label: 'Stored file', value: 'asha-20260615T083010000Z-photo-1.jpg' },
      { label: 'Original size', value: '4.3 MB' },
      { label: 'Stored size', value: '1.4 MB' },
      { label: 'Type', value: 'image/jpeg' }
    ]);
  });

  it('uses unknown labels for missing image metadata', () => {
    expect(
      buildPhotoDetailRows({
        originalName: 'photo.jpg',
        storedName: 'photo.jpg',
        sizeBytes: 1024,
        originalSizeBytes: null,
        contentType: 'image/jpeg',
        metadata: {}
      }).slice(0, 3)
    ).toEqual([
      { label: 'Camera', value: 'Not available' },
      { label: 'Captured', value: 'Not available' },
      { label: 'Location', value: 'Not available' }
    ]);
  });
});
