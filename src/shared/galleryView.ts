export const GALLERY_VIEWS = ['grid', 'constellation'] as const;

export type GalleryView = (typeof GALLERY_VIEWS)[number];

export const GALLERY_VIEW_LABELS: Record<GalleryView, string> = {
  grid: 'Gallery',
  constellation: 'Constellation'
};

export function isGalleryView(value: string): value is GalleryView {
  return GALLERY_VIEWS.includes(value as GalleryView);
}

export function getGalleryViewLabel(view: GalleryView): string {
  return GALLERY_VIEW_LABELS[view];
}
