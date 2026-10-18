/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_REACT_APP_PUBLIC_URL: string;
  readonly VITE_REACT_APP_API_URL: string;
  readonly VITE_REACT_APP_IMAGE_URL: string;
}
