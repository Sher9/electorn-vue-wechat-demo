import { Store } from 'pinia'
import type { User, Chat, Contact } from './models'

// User Store 状态
export interface UserState {
  token: string | null
  user: User | null
  permissions: string[]
}

// Chat Store 状态
export interface ChatState {
  chats: Chat[]
  currentChatId: string | null
  contacts: Contact[]
  typingUsers: Set<string>
}

// Settings Store 状态
export interface SettingsState {
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  notification: {
    enabled: boolean
    sound: boolean
    desktop: boolean
  }
}

// Root Store 类型
export type RootStore = {
  user: Store<'user', UserState>
  chat: Store<'chat', ChatState>
  settings: Store<'settings', SettingsState>
} 