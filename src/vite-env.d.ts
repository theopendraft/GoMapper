/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENCAGE_API_KEY: string;
  // Add other environment variables here if you use them,
  // following the VITE_ prefix
  // readonly VITE_ANOTHER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}