export const TOKEN_KEY = 'wechat_token'
export const USER_INFO_KEY = 'wechat_user_info'
export const NOTIFICATION_SETTINGS_KEY = 'wechat_notification_settings'

export const DEFAULT_AVATAR = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  EMOJI: 'emoji',
  SYSTEM: 'system'
} as const

export const WEBSOCKET_EVENTS = {
  CHAT: 'chat',
  HEARTBEAT: 'heartbeat',
  ONLINE: 'online',
  OFFLINE: 'offline'
} as const 