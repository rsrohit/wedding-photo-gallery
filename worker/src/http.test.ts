import { describe, expect, it } from 'vitest';
import {
  createCorsHeaders,
  errorResponse,
  jsonResponse,
  parseEventPhotoPath,
  parseEventPhotoViewPath
} from './http';

describe('jsonResponse', () => {
  it('returns JSON with CORS headers', async () => {
    const response = jsonResponse({ ok: true }, 201, 'https://example.com');

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('access-control-allow-origin')).toBe('https://example.com');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});

describe('errorResponse', () => {
  it('returns a structured JSON error', async () => {
    const response = errorResponse('Not found', 404, '*');

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Not found' });
  });
});

describe('createCorsHeaders', () => {
  it('allows configured origins', () => {
    const headers = createCorsHeaders('https://rohit.github.io', [
      'https://rohit.github.io'
    ]);

    expect(headers['access-control-allow-origin']).toBe('https://rohit.github.io');
  });

  it('falls back to wildcard when no allowlist is configured', () => {
    const headers = createCorsHeaders('https://guest.example', []);

    expect(headers['access-control-allow-origin']).toBe('*');
  });
});

describe('parseEventPhotoPath', () => {
  it('parses event photo file paths', () => {
    expect(parseEventPhotoPath('/api/events/wedding/photos/photo-123/file')).toEqual({
      eventSlug: 'wedding',
      photoId: 'photo-123'
    });
  });

  it('returns null for unrelated paths', () => {
    expect(parseEventPhotoPath('/api/events/wedding/photos')).toBeNull();
  });
});

describe('parseEventPhotoViewPath', () => {
  it('parses event photo view paths', () => {
    expect(parseEventPhotoViewPath('/api/events/wedding/photos/photo-123/view')).toEqual({
      eventSlug: 'wedding',
      photoId: 'photo-123'
    });
  });

  it('returns null for file paths', () => {
    expect(parseEventPhotoViewPath('/api/events/wedding/photos/photo-123/file')).toBeNull();
  });
});
