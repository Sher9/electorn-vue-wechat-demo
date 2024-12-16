/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'element-plus/dist/locale/zh-cn.mjs'

interface ImportMetaEnv {
  readonly VITE_BASE_API: string
  readonly VITE_WS_URL: string
  readonly VITE_DEV_SERVER_URL: string
  readonly VITE_STATIC_URL: string
  readonly VITE_QR_CONFIRM_URL: string
  readonly VITE_BASE_SERVER_URL: string
}


interface ImportMeta {
  readonly env: ImportMetaEnv
} 