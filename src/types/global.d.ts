declare module 'element-plus/dist/locale/zh-cn.mjs'
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@element-plus/icons-vue'

declare const ElMessage: {
  success(message: string): void
  warning(message: string): void
  error(message: string): void
}

declare const ElNotification: {
  success(options: { title: string; message: string }): void
  warning(options: { title: string; message: string }): void
  error(options: { title: string; message: string }): void
}

declare interface Window {
  // 扩展 window 对象
  __INITIAL_STATE__: any
}

declare module '*.svg' {
  const content: any
  export default content
}

declare module '*.png' {
  const content: any
  export default content
}

declare module '*.jpg' {
  const content: any
  export default content
}

declare module '*.gif' {
  const content: any
  export default content
}

declare module '*.webp' {
  const content: any
  export default content
}

declare module 'qrcode' {
  const content: any
  export default content
}
// Element Plus 全局组件类型
declare module 'element-plus/es/components/message/style/css'
declare module 'element-plus/es/components/notification/style/css'
declare module 'element-plus/es/components/message-box/style/css' 