import { useUserStore } from '@/store/modules/user'
import { useChatStore } from '@/store/modules/chat'
import { ElNotification } from 'element-plus'
export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null

  constructor(private url: string) { }

  connect() {
    const userStore = useUserStore()
    if (!userStore.token) return

    this.ws = new WebSocket(`${this.url}?token=${userStore.token}`)

    this.ws.onopen = () => {
      console.log('WebSocket连接成功')
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.handleMessage(data)
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

  private handleMessage(data: any) {
    const chatStore = useChatStore()

    switch (data.type) {
      case 'chat':
        chatStore.addMessage({
          id: data.id,
          content: data.content,
          senderId: data.senderId,
          receiverId: data.receiverId,
          timestamp: data.timestamp,
          type: data.messageType,
          isMine: false,
          avatar: '',  // 这个会在 store 中设置
          senderName: '',  // 这个会在 store 中设置
          time: new Date(data.timestamp).toLocaleTimeString()
        })

        // 显示消息通知
        if (document.hidden) {
          ElNotification({
            title: '新消息',
            message: data.content,
            type: 'success'
          })
        }
        break

      case 'image':
        // 处理图片消息
        break

      case 'emoji':
        // 处理表情消息
        break
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

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
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

// 创建WebSocket实例
export const ws = new WebSocketClient(import.meta.env.VITE_WS_URL) 