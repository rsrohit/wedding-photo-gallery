export type PhotoCollectionItem = {
  id: string;
  createdAt: string;
  viewCount: number;
};

export type AdjacentDirection = 'previous' | 'next';

export function getRecentlyUploadedPhotos<T extends PhotoCollectionItem>(
  photos: T[],
  limit = photos.length
): T[] {
  return [...photos]
    .sort((left, right) => compareNewestFirst(left.createdAt, right.createdAt))
    .slice(0, limit);
}

export function getMostViewedPhotos<T extends PhotoCollectionItem>(
  photos: T[],
  limit = photos.length
): T[] {
  return [...photos]
    .sort((left, right) => {
      if (right.viewCount !== left.viewCount) {
        return right.viewCount - left.viewCount;
      }

      return compareNewestFirst(left.createdAt, right.createdAt);
    })
    .slice(0, limit);
}

export function getAdjacentPhoto<T extends { id: string }>(
  photos: T[],
  currentPhotoId: string,
  direction: AdjacentDirection
): T | null {
  if (photos.length === 0) {
    return null;
  }

  const currentIndex = photos.findIndex((photo) => photo.id === currentPhotoId);
  if (currentIndex < 0) {
    return null;
  }

  const offset = direction === 'next' ? 1 : -1;
  const nextIndex = (currentIndex + offset + photos.length) % photos.length;
  return photos[nextIndex];
}

function compareNewestFirst(leftDate: string, rightDate: string): number {
  return new Date(rightDate).getTime() - new Date(leftDate).getTime();
}
