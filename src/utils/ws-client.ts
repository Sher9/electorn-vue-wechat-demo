import { useUserStore } from '@/store/modules/user'
import { useChatStore } from '@/store/modules/chat'
import { ElNotification } from 'element-plus'
import type { Message } from '@/types'

export class WSClient {
  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private messageQueue: any[] = []

  constructor(private url: string) { }

  connect() {
    const userStore = useUserStore()
    if (!userStore.token) return

    this.ws = new WebSocket(`${this.url}?token=${userStore.token}`)

    this.ws.onopen = () => {
      console.log('WebSocket连接成功')
      this.startHeartbeat()
      this.flushMessageQueue()
    }

    this.ws.onmessage = (event) => {
      // 将消息转发给窗口
      window.postMessage(event.data, '*')
    }

    this.ws.onclose = () => {
      console.log('WebSocket连接关闭')
      this.reconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
      this.reconnect()
    }
  }

  private handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data)
    const chatStore = useChatStore()

    switch (data.type) {
      case 'chat':
        chatStore.addMessage(data.message)
        if (document.hidden) {
          ElNotification({
            title: '新消息',
            message: data.message.content,
            type: 'success'
          })
        }
        break

      case 'status':
        chatStore.updateContactStatus(data.userId, data.online)
        break

      case 'typing':
        chatStore.setTypingStatus(data.userId)
        break

      case 'read':
        chatStore.markMessagesAsRead(data.chatId)
        break
      case 'call':
        // 触发通话事件
        const event = new CustomEvent('callSignal', {
          detail: data.data
        });
        window.dispatchEvent(event);
        break
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      this.messageQueue.push(data)
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift()
      this.send(data)
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = window.setInterval(() => {
      this.send({ type: 'heartbeat' })
    }, 30000)
  }

  private reconnect() {
    if (this.reconnectTimer) return

    this.reconnectTimer = window.setInterval(() => {
      console.log('尝试重新连接...')
      this.connect()
    }, 3000)
  }

  close() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)
    }
    this.ws?.close()
  }
}

export const wsClient = new WSClient(import.meta.env.VITE_WS_URL) 