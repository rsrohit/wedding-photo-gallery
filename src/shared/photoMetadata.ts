export type PhotoMetadata = {
  cameraMake?: string;
  cameraModel?: string;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
};

type Rational = [number, number];

type ExifValue = string | number | Rational | Rational[];

const ASCII = 2;
const SHORT = 3;
const LONG = 4;
const RATIONAL = 5;

const TYPE_BYTE_SIZES: Record<number, number> = {
  1: 1,
  [ASCII]: 1,
  [SHORT]: 2,
  [LONG]: 4,
  [RATIONAL]: 8,
  7: 1,
  9: 4,
  10: 8
};

export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
  if (!file.type.includes('jpeg') && !file.name.toLowerCase().match(/\.jpe?g$/)) {
    return {};
  }

  try {
    return normalizePhotoMetadata(parseJpegExif(await file.arrayBuffer()));
  } catch {
    return {};
  }
}

export function normalizePhotoMetadata(metadata: PhotoMetadata): PhotoMetadata {
  const normalized: PhotoMetadata = {};
  const cameraMake = cleanText(metadata.cameraMake);
  const cameraModel = cleanText(metadata.cameraModel);
  const capturedAt = cleanText(metadata.capturedAt);

  if (cameraMake) {
    normalized.cameraMake = cameraMake;
  }

  if (cameraModel) {
    normalized.cameraModel = cameraModel;
  }

  if (capturedAt) {
    normalized.capturedAt = capturedAt;
  }

  if (isValidLatitude(metadata.latitude)) {
    normalized.latitude = roundCoordinate(metadata.latitude);
  }

  if (isValidLongitude(metadata.longitude)) {
    normalized.longitude = roundCoordinate(metadata.longitude);
  }

  return normalized;
}

export function formatExifDateTime(value: string): string | undefined {
  const match = value.trim().match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
  );

  if (!match) {
    return undefined;
  }

  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`;
}

export function parseGpsCoordinate(values: Rational[], reference: string): number | undefined {
  if (values.length < 3) {
    return undefined;
  }

  const degrees = rationalToNumber(values[0]);
  const minutes = rationalToNumber(values[1]);
  const seconds = rationalToNumber(values[2]);

  if ([degrees, minutes, seconds].some((value) => !Number.isFinite(value))) {
    return undefined;
  }

  const sign = reference === 'S' || reference === 'W' ? -1 : 1;
  return roundCoordinate(sign * (degrees + minutes / 60 + seconds / 3600));
}

function parseJpegExif(buffer: ArrayBuffer): PhotoMetadata {
  const view = new DataView(buffer);

  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return {};
  }

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      break;
    }

    const marker = view.getUint8(offset + 1);
    const segmentLength = view.getUint16(offset + 2);
    const segmentStart = offset + 4;

    if (marker === 0xe1 && isExifSegment(view, segmentStart)) {
      return parseTiff(view, segmentStart + 6);
    }

    offset += 2 + segmentLength;
  }

  return {};
}

function isExifSegment(view: DataView, offset: number): boolean {
  return (
    view.getUint8(offset) === 0x45 &&
    view.getUint8(offset + 1) === 0x78 &&
    view.getUint8(offset + 2) === 0x69 &&
    view.getUint8(offset + 3) === 0x66 &&
    view.getUint8(offset + 4) === 0 &&
    view.getUint8(offset + 5) === 0
  );
}

function parseTiff(view: DataView, tiffStart: number): PhotoMetadata {
  const byteOrder = readAscii(view, tiffStart, 2);
  const littleEndian = byteOrder === 'II';

  if (!littleEndian && byteOrder !== 'MM') {
    return {};
  }

  if (view.getUint16(tiffStart + 2, littleEndian) !== 42) {
    return {};
  }

  const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian);
  const ifd0 = readIfd(view, tiffStart, tiffStart + ifd0Offset, littleEndian);
  const metadata: PhotoMetadata = {
    cameraMake: getString(ifd0.get(0x010f)),
    cameraModel: getString(ifd0.get(0x0110)),
    capturedAt: formatExifDateTime(
      getString(ifd0.get(0x0132)) || ''
    )
  };

  const exifIfdOffset = getNumber(ifd0.get(0x8769));
  if (exifIfdOffset) {
    const exif = readIfd(view, tiffStart, tiffStart + exifIfdOffset, littleEndian);
    const capturedAt =
      formatExifDateTime(getString(exif.get(0x9003)) || '') ||
      formatExifDateTime(getString(exif.get(0x9004)) || '');

    if (capturedAt) {
      metadata.capturedAt = capturedAt;
    }
  }

  const gpsIfdOffset = getNumber(ifd0.get(0x8825));
  if (gpsIfdOffset) {
    const gps = readIfd(view, tiffStart, tiffStart + gpsIfdOffset, littleEndian);
    const latitude = parseGpsCoordinate(
      getRationals(gps.get(0x0002)),
      getString(gps.get(0x0001)) || ''
    );
    const longitude = parseGpsCoordinate(
      getRationals(gps.get(0x0004)),
      getString(gps.get(0x0003)) || ''
    );

    if (latitude !== undefined) {
      metadata.latitude = latitude;
    }

    if (longitude !== undefined) {
      metadata.longitude = longitude;
    }
  }

  return metadata;
}

function readIfd(
  view: DataView,
  tiffStart: number,
  offset: number,
  littleEndian: boolean
): Map<number, ExifValue> {
  const values = new Map<number, ExifValue>();

  if (offset < 0 || offset + 2 > view.byteLength) {
    return values;
  }

  const entryCount = view.getUint16(offset, littleEndian);
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = offset + 2 + index * 12;
    if (entryOffset + 12 > view.byteLength) {
      break;
    }

    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);
    const value = readExifValue(view, tiffStart, entryOffset, type, count, littleEndian);

    if (value !== undefined) {
      values.set(tag, value);
    }
  }

  return values;
}

function readExifValue(
  view: DataView,
  tiffStart: number,
  entryOffset: number,
  type: number,
  count: number,
  littleEndian: boolean
): ExifValue | undefined {
  const typeSize = TYPE_BYTE_SIZES[type];
  if (!typeSize) {
    return undefined;
  }

  const byteLength = typeSize * count;
  const inline = byteLength <= 4;
  const valueOffset = inline
    ? entryOffset + 8
    : tiffStart + view.getUint32(entryOffset + 8, littleEndian);

  if (valueOffset < 0 || valueOffset + byteLength > view.byteLength) {
    return undefined;
  }

  if (type === ASCII) {
    return readAscii(view, valueOffset, count).replace(/\0+$/, '');
  }

  if (type === SHORT) {
    return view.getUint16(valueOffset, littleEndian);
  }

  if (type === LONG) {
    return view.getUint32(valueOffset, littleEndian);
  }

  if (type === RATIONAL) {
    const values: Rational[] = [];
    for (let index = 0; index < count; index += 1) {
      const rationalOffset = valueOffset + index * 8;
      values.push([
        view.getUint32(rationalOffset, littleEndian),
        view.getUint32(rationalOffset + 4, littleEndian)
      ]);
    }

    return count === 1 ? values[0] : values;
  }

  return undefined;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let value = '';
  for (let index = 0; index < length && offset + index < view.byteLength; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }
  return value;
}

function getString(value: ExifValue | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getNumber(value: ExifValue | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function getRationals(value: ExifValue | undefined): Rational[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value) && Array.isArray(value[0])) {
    return value as Rational[];
  }

  return [];
}

function rationalToNumber(value: Rational): number {
  if (value[1] === 0) {
    return Number.NaN;
  }

  return value[0] / value[1];
}

function cleanText(value: string | undefined): string | undefined {
  const cleaned = value?.trim().replace(/\s+/g, ' ');
  return cleaned || undefined;
}

function isValidLatitude(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
