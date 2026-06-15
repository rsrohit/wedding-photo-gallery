import { describe, expect, it } from 'vitest';
import {
  getAdjacentPhoto,
  getMostViewedPhotos,
  getRecentlyUploadedPhotos
} from './photoCollections';

type TestPhoto = {
  id: string;
  createdAt: string;
  viewCount: number;
};

const photos: TestPhoto[] = [
  { id: 'old-popular', createdAt: '2026-06-15T08:00:00.000Z', viewCount: 12 },
  { id: 'newest', createdAt: '2026-06-15T10:00:00.000Z', viewCount: 2 },
  { id: 'middle-popular', createdAt: '2026-06-15T09:00:00.000Z', viewCount: 12 },
  { id: 'quiet', createdAt: '2026-06-15T07:00:00.000Z', viewCount: 0 }
];

describe('getRecentlyUploadedPhotos', () => {
  it('sorts newest photos first and respects a limit', () => {
    expect(getRecentlyUploadedPhotos(photos, 2).map((photo) => photo.id)).toEqual([
      'newest',
      'middle-popular'
    ]);
  });
});

describe('getMostViewedPhotos', () => {
  it('sorts by view count and uses newest first for ties', () => {
    expect(getMostViewedPhotos(photos).map((photo) => photo.id)).toEqual([
      'middle-popular',
      'old-popular',
      'newest',
      'quiet'
    ]);
  });

  it('respects a result limit', () => {
    expect(getMostViewedPhotos(photos, 2).map((photo) => photo.id)).toEqual([
      'middle-popular',
      'old-popular'
    ]);
  });
});

describe('getAdjacentPhoto', () => {
  it('loops to the next photo from the end', () => {
    expect(getAdjacentPhoto(photos, 'quiet', 'next')?.id).toBe('old-popular');
  });

  it('loops to the previous photo from the beginning', () => {
    expect(getAdjacentPhoto(photos, 'old-popular', 'previous')?.id).toBe('quiet');
  });

  it('returns null when the current photo is missing', () => {
    expect(getAdjacentPhoto(photos, 'missing', 'next')).toBeNull();
  });
});
