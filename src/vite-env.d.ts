/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WORDPRESS_URL: string;
  readonly VITE_BREVO_API_KEY: string;
  readonly VITE_BREVO_LIST_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}