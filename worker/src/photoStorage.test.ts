import { describe, expect, it } from 'vitest';
import {
  buildPhotoMetadata,
  createPhotoObjectKey,
  parsePhotoMetadataPayload
} from './photoStorage';

describe('createPhotoObjectKey', () => {
  it('uses the event, uploader, upload time, random id, and extension', () => {
    expect(
      createPhotoObjectKey({
        eventSlug: 'wedding',
        uploaderName: 'Asha Mehta',
        uploadedAt: '2026-06-15T08:30:10.000Z',
        photoId: '12345678-abcd',
        originalName: 'Ceremony Portrait.JPG',
        contentType: 'image/jpeg'
      })
    ).toBe('wedding/asha-mehta-20260615T083010000Z-12345678.jpg');
  });
});

describe('parsePhotoMetadataPayload', () => {
  it('keeps supported metadata fields and drops unsafe extra fields', () => {
    expect(
      parsePhotoMetadataPayload(
        JSON.stringify({
          cameraMake: 'Canon',
          cameraModel: 'EOS R6',
          capturedAt: '2024-12-01T10:20:30.000Z',
          latitude: 18.5204,
          longitude: 73.8567,
          ignored: '<script>'
        })
      )
    ).toEqual({
      cameraMake: 'Canon',
      cameraModel: 'EOS R6',
      capturedAt: '2024-12-01T10:20:30.000Z',
      latitude: 18.5204,
      longitude: 73.8567
    });
  });

  it('returns empty metadata for invalid JSON', () => {
    expect(parsePhotoMetadataPayload('{bad json')).toEqual({});
  });
});

describe('buildPhotoMetadata', () => {
  it('serializes metadata for R2 custom metadata', () => {
    expect(
      buildPhotoMetadata({
        eventSlug: 'wedding',
        photoId: 'photo-1',
        uploaderName: 'Asha',
        originalName: 'ceremony.jpg',
        storedName: 'asha-20260615T083010000Z-photo-1.jpg',
        metadata: {
          cameraMake: 'Canon',
          cameraModel: 'EOS R6',
          capturedAt: '2024-12-01T10:20:30.000Z',
          latitude: 18.5204,
          longitude: 73.8567
        }
      })
    ).toEqual({
      cameraMake: 'Canon',
      cameraModel: 'EOS R6',
      capturedAt: '2024-12-01T10:20:30.000Z',
      eventSlug: 'wedding',
      latitude: '18.5204',
      longitude: '73.8567',
      originalName: 'ceremony.jpg',
      photoId: 'photo-1',
      storedName: 'asha-20260615T083010000Z-photo-1.jpg',
      uploaderName: 'Asha'
    });
  });
});
