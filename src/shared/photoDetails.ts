import { PhotoMetadata } from './photoMetadata';

export type PhotoDetailSource = {
  originalName: string;
  storedName: string;
  sizeBytes: number;
  originalSizeBytes: number | null;
  contentType: string;
  metadata: PhotoMetadata;
};

export type PhotoDetailRow = {
  label: string;
  value: string;
};

export function buildPhotoDetailRows(photo: PhotoDetailSource): PhotoDetailRow[] {
  return [
    { label: 'Camera', value: formatCamera(photo.metadata) },
    { label: 'Captured', value: formatCapturedAt(photo.metadata.capturedAt) },
    { label: 'Location', value: formatLocation(photo.metadata.latitude, photo.metadata.longitude) },
    { label: 'Original file', value: photo.originalName },
    { label: 'Stored file', value: photo.storedName },
    ...(photo.originalSizeBytes
      ? [{ label: 'Original size', value: formatBytes(photo.originalSizeBytes) }]
      : []),
    { label: 'Stored size', value: formatBytes(photo.sizeBytes) },
    { label: 'Type', value: photo.contentType }
  ];
}

function formatCamera(metadata: PhotoMetadata): string {
  const camera = [metadata.cameraMake, metadata.cameraModel]
    .filter(Boolean)
    .join(' ')
    .trim();

  return camera || 'Not available';
}

function formatCapturedAt(value: string | undefined): string {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function formatLocation(latitude: number | undefined, longitude: number | undefined): string {
  if (latitude === undefined || longitude === undefined) {
    return 'Not available';
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
