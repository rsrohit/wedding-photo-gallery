import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  buildApiUrl,
  deletePhoto,
  hidePhoto,
  uploadPhoto
} from './api';

describe('buildApiUrl', () => {
  it('joins base URL and path without duplicate slashes', () => {
    expect(buildApiUrl('https://gallery-api.example.workers.dev/', '/api/health')).toBe(
      'https://gallery-api.example.workers.dev/api/health'
    );
  });

  it('keeps query strings intact', () => {
    expect(buildApiUrl('https://api.example', '/api/photos?after=abc')).toBe(
      'https://api.example/api/photos?after=abc'
    );
  });
});

describe('API mutations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws a readable ApiError when upload fails with JSON error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        json: () => Promise.resolve({ error: 'Photo is too large.' })
      })
    );

    await expect(
      uploadPhoto({
        apiBaseUrl: 'https://api.example',
        eventSlug: 'wedding',
        file: new File(['x'], 'photo.jpg', { type: 'image/jpeg' }),
        uploaderName: 'Guest'
      })
    ).rejects.toEqual(new ApiError('Photo is too large.', 413));
  });

  it('sends admin token when hiding a photo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true })
    });
    vi.stubGlobal('fetch', fetchMock);

    await hidePhoto({
      apiBaseUrl: 'https://api.example',
      eventSlug: 'wedding',
      photoId: 'photo-1',
      adminToken: 'secret'
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example/api/admin/events/wedding/photos/photo-1/hide',
      expect.objectContaining({
        method: 'POST',
        headers: { 'x-admin-token': 'secret' }
      })
    );
  });

  it('sends DELETE with admin token when deleting a photo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true })
    });
    vi.stubGlobal('fetch', fetchMock);

    await deletePhoto({
      apiBaseUrl: 'https://api.example',
      eventSlug: 'wedding',
      photoId: 'photo-1',
      adminToken: 'secret'
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example/api/admin/events/wedding/photos/photo-1',
      expect.objectContaining({
        method: 'DELETE',
        headers: { 'x-admin-token': 'secret' }
      })
    );
  });
});
