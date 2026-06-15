/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_EVENT_SLUG?: string;
  readonly VITE_EVENT_TITLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
