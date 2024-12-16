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

// 消息类型
export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'emoji';
  timestamp: number;
  isMine: boolean;
  sender_avatar: string;
  sender_name: string;
  time: string;
  sender_id?: string;
  receiver_id?: string; 
  read?: boolean;
  created_at?: string;
}
// 聊天类型
export interface Chat {
  id: string;
  name?: string;
  groupId?: string;
  groupName?: string;
  groupAvatar?: string;
  avatar?: string;
  lastMessage?: string;
  lastTime?: string;
  messages: Message[];
  isGroup?: boolean;
  unreadCount?: number;
  participantId?: string;
  ownerId?: string;
}

// 联系人类型
export interface Contact {
  id: string
  username: string
  name: string
  avatar: string
  firstLetter?: string
  online?: boolean
}

// 上传结果类型
export interface UploadResult {
  url: string
  name: string
  size?: number
}

export interface RTCClient {
  handleOffer: (sdp: any, senderId: string) => Promise<void>
  handleAnswer: (sdp: any) => Promise<void>
  handleCandidate: (candidate: any) => Promise<void>
}