// API响应类型
export interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

// 用户类型
export interface User {
  id: string
  username: string
  avatar: string
  token?: string
}

// 聊天类型
export interface Chat {
  id: string
  name?: string
  groupName?: string
  groupAvatar?: string
  avatar?: string
  lastMessage?: string
  lastTime?: string
  messages: Message[]
  isGroup?: boolean
  unreadCount?: number
  participants: string[]
  ownerId?: string
}

// 消息类型
export interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  type: 'text' | 'image' | 'emoji'
  timestamp: number
  isMine: boolean
  avatar: string
  senderName: string
  time: string
}

// 联系人类型
export interface Contact {
  id: string
  name: string
  avatar: string
  wxid: string
  online?: boolean
}

// 上传结果类型
export interface UploadResult {
  url: string
  name: string
  size?: number
}