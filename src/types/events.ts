import type { Message } from './models'

// WebSocket 事件类型
export enum WSEventType {
  CHAT = 'chat',
  TYPING = 'typing',
  READ = 'read',
  STATUS = 'status',
  HEARTBEAT = 'heartbeat'
}

// WebSocket 事件数据
export interface WSEventData {
  chat: {
    message: Message
  }
  typing: {
    userId: string
    chatId: string
  }
  read: {
    userId: string
    chatId: string
    messageIds: string[]
  }
  status: {
    userId: string
    online: boolean
  }
  heartbeat: {
    timestamp: number
  }
}

// 自定义事件类型
export interface CustomEventMap {
  'message:received': Message
  'message:sent': Message
  'message:read': { chatId: string; messageIds: string[] }
  'user:typing': { userId: string; chatId: string }
  'user:online': { userId: string; online: boolean }
  'chat:selected': { chatId: string }
}

// 声明自定义事件
declare global {
  interface WindowEventMap extends CustomEventMap {}
} 