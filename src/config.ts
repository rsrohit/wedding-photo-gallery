export type AppConfig = {
  apiBaseUrl: string;
  eventSlug: string;
  eventTitle: string;
};

type AppEnv = Partial<{
  VITE_API_BASE_URL: string;
  VITE_EVENT_SLUG: string;
  VITE_EVENT_TITLE: string;
}>;

const DEFAULT_API_BASE_URL = 'https://wedding-photo-gallery-api.rsrohit.workers.dev';
const DEFAULT_EVENT_SLUG = 'wedding';
const DEFAULT_EVENT_TITLE = 'Wedding Photo Gallery';

export function resolveAppConfig(env: AppEnv): AppConfig {
  return {
    apiBaseUrl: env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
    eventSlug: env.VITE_EVENT_SLUG || DEFAULT_EVENT_SLUG,
    eventTitle: env.VITE_EVENT_TITLE || DEFAULT_EVENT_TITLE
  };
}

export const appConfig = resolveAppConfig(import.meta.env);
