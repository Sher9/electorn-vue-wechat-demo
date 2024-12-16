/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_API: string
  readonly VITE_WS_URL: string
  readonly VITE_DEV_SERVER_URL: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 