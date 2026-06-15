import {
  MAX_STORED_PHOTO_SIZE_BYTES,
  validatePhotoFile
} from '../shared/photoValidation';
import { PhotoMetadata, extractPhotoMetadata } from '../shared/photoMetadata';

export type PreparedPhotoUpload = {
  file: File;
  metadata: PhotoMetadata;
  originalName: string;
  originalSizeBytes: number;
};

const TARGET_STORED_PHOTO_SIZE_BYTES = MAX_STORED_PHOTO_SIZE_BYTES - 96 * 1024;
const MAX_IMAGE_DIMENSION = 2200;
const MIN_IMAGE_DIMENSION = 900;
const QUALITY_STEPS = [0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36];

export async function preparePhotoForUpload(file: File): Promise<PreparedPhotoUpload> {
  const originalValidation = validatePhotoFile(file);
  if (!originalValidation.ok) {
    throw new Error(originalValidation.message);
  }

  const metadata = await extractPhotoMetadata(file);
  const compressedBlob = await compressImage(file);
  const compressedFile = createStoredImageFile(compressedBlob, file.name);
  const storedValidation = validatePhotoFile(compressedFile, { stored: true });

  if (!storedValidation.ok) {
    throw new Error(storedValidation.message);
  }

  return {
    file: compressedFile,
    metadata,
    originalName: file.name || compressedFile.name,
    originalSizeBytes: file.size
  };
}

export function createCompressedFileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'photo';
  const cleaned = baseName
    .normalize('NFKD')
    .replace(/[^\w]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return `${cleaned || 'photo'}.jpg`;
}

export function shouldUseCompressedBlob({
  originalSize,
  compressedSize
}: {
  originalSize: number;
  compressedSize: number;
}): boolean {
  return compressedSize < MAX_STORED_PHOTO_SIZE_BYTES && compressedSize < originalSize;
}

export function createStoredImageFile(blob: Blob, originalName: string): File {
  return new File([blob], createCompressedFileName(originalName), {
    type: 'image/jpeg',
    lastModified: Date.now()
  });
}

async function compressImage(file: File): Promise<Blob> {
  const image = await loadImage(file);
  let maxDimension = MAX_IMAGE_DIMENSION;

  while (maxDimension >= MIN_IMAGE_DIMENSION) {
    const { width, height } = fitWithin(image.width, image.height, maxDimension);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Image compression is not available in this browser.');
    }

    context.drawImage(image, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob.size < TARGET_STORED_PHOTO_SIZE_BYTES) {
        return blob;
      }
    }

    maxDimension = Math.floor(maxDimension * 0.82);
  }

  throw new Error('Could not compress this photo below 2 MB. Try a smaller image.');
}

function fitWithin(width: number, height: number, maxDimension: number): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    image.src = objectUrl;
    await image.decode();
    return image;
  } catch {
    throw new Error('This browser could not read the selected image for compression.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Image compression failed.'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}
