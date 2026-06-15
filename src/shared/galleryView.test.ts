import { describe, expect, it } from 'vitest';
import { GALLERY_VIEW_LABELS, getGalleryViewLabel, isGalleryView } from './galleryView';

describe('gallery view helpers', () => {
  it('accepts supported gallery view modes', () => {
    expect(isGalleryView('grid')).toBe(true);
    expect(isGalleryView('constellation')).toBe(true);
  });

  it('rejects unsupported gallery view modes', () => {
    expect(isGalleryView('timeline')).toBe(false);
    expect(isGalleryView('')).toBe(false);
  });

  it('returns display labels for each mode', () => {
    expect(getGalleryViewLabel('grid')).toBe(GALLERY_VIEW_LABELS.grid);
    expect(getGalleryViewLabel('constellation')).toBe(GALLERY_VIEW_LABELS.constellation);
  });
});
