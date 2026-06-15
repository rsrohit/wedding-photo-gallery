import { describe, expect, it } from 'vitest';
import {
  formatExifDateTime,
  normalizePhotoMetadata,
  parseGpsCoordinate
} from './photoMetadata';

describe('formatExifDateTime', () => {
  it('converts EXIF date/time text to ISO text', () => {
    expect(formatExifDateTime('2024:12:01 10:20:30')).toBe('2024-12-01T10:20:30');
  });
});

describe('parseGpsCoordinate', () => {
  it('converts degrees, minutes, and seconds to decimal coordinates', () => {
    expect(
      parseGpsCoordinate(
        [
          [18, 1],
          [31, 1],
          [1344, 100]
        ],
        'N'
      )
    ).toBeCloseTo(18.5204, 4);
  });

  it('uses negative values for west and south references', () => {
    expect(
      parseGpsCoordinate(
        [
          [73, 1],
          [51, 1],
          [2412, 100]
        ],
        'W'
      )
    ).toBeCloseTo(-73.8567, 4);
  });
});

describe('normalizePhotoMetadata', () => {
  it('trims strings and drops invalid coordinates', () => {
    expect(
      normalizePhotoMetadata({
        cameraMake: ' Canon ',
        cameraModel: ' EOS R6 ',
        capturedAt: '2024-12-01T10:20:30',
        latitude: 91,
        longitude: 73.8567
      })
    ).toEqual({
      cameraMake: 'Canon',
      cameraModel: 'EOS R6',
      capturedAt: '2024-12-01T10:20:30',
      longitude: 73.8567
    });
  });
});
