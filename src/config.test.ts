import { describe, expect, it } from 'vitest';
import { resolveAppConfig } from './config';

describe('resolveAppConfig', () => {
  it('uses the deployed Worker URL when no API URL is provided', () => {
    expect(resolveAppConfig({}).apiBaseUrl).toBe(
      'https://wedding-photo-gallery-api.rsrohit.workers.dev'
    );
  });

  it('allows environment values to override defaults', () => {
    expect(
      resolveAppConfig({
        VITE_API_BASE_URL: 'https://api.example',
        VITE_EVENT_SLUG: 'sangeet',
        VITE_EVENT_TITLE: 'Sangeet Photos'
      })
    ).toEqual({
      apiBaseUrl: 'https://api.example',
      eventSlug: 'sangeet',
      eventTitle: 'Sangeet Photos'
    });
  });
});
