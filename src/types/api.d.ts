// API 响应格式
interface ApiResponse<T = any> {
  code: number
  data: T
  message?: string
}

// 分页响应格式
interface PageResponse<T = any> {
  list: T[]
  total: number
  page: number
  size: number
}

// 分页请求参数
interface PageParams {
  page: number
  size: number
  [key: string]: any
}

// 上传文件响应
interface UploadResponse {
  url: string
  name: string
  size: number
  type: string
}

// WebSocket 消息格式
interface WSMessage<T = any> {
  type: string
  data: T
  timestamp: number
} 