/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_API_BASE_URL?: string;
  readonly VITE_ANALYTICS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
