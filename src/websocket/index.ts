import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config'

interface WebSocketClient  {
  userId?: string;
  isAlive?: boolean;
  terminate: () => void;
  ping: () => void;
  send: (data: string) => void;
  close: () => void;
  on: (event: string, listener: (...args: any[]) => void) => void;
  readyState: number;
}

export class WebSocketService {
  private wss: WebSocketServer
  private clients: Map<string, WebSocketClient> = new Map()

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server })
    this.init()
  }

  private init() {
    this.wss.on('connection', (ws: WebSocketClient, req) => {
      const token = new URL(req.url!, 'http://localhost').searchParams.get('token')

      if (!token) {
        ws.close()
        return
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
        ws.userId = decoded.userId
        ws.isAlive = true
        this.clients.set(decoded.userId, ws)

        ws.on('message', (data) => {
          this.handleMessage(ws, data.toString())
        })

        ws.on('close', () => {
          if (ws.userId) {
            this.clients.delete(ws.userId)
          }
        })

        ws.on('pong', () => {
          ws.isAlive = true
        })
      } catch (error) {
        ws.close()
      }
    })

    // 心跳检测
    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (ws.isAlive === false) {
          return ws.terminate()
        }
        ws.isAlive = false
        ws.ping()
      })
    }, 30000)
  }

  private handleMessage(ws: WebSocketClient, message: string) {
    try {
      const data = JSON.parse(message)
      switch (data.type) {
        case 'chat':
          this.broadcastMessage(ws.userId!, data)
          break
        case 'heartbeat':
          ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }))
          break
      }
    } catch (error) {
      console.error('处理消息错误:', error)
    }
  }

  public broadcastMessage(senderId: string, message: any) {
    const { receiverId } = message
    const receiverWs = this.clients.get(receiverId)

    if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
      receiverWs.send(JSON.stringify({
        ...message,
        senderId
      }))
    }
  }
} 