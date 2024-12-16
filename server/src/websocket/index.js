const { WebSocketServer, WebSocket } = require('ws')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config')
const { store } = require('../store')

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' })
    this.clients = new Map()
    this.init()
  }

  init() {
    this.wss.on('connection', async (ws, req) => {
      try {
        const token = this.getTokenFromUrl(req.url)
        if (!token) {
          ws.close()
          return
        }

        const decoded = jwt.verify(token, JWT_SECRET)
        const user = store.getUserById(decoded.userId)

        if (!user) {
          ws.close()
          return
        }

        ws.userId = decoded.userId
        ws.isAlive = true
        this.clients.set(decoded.userId, ws)

        // 发送上线通知
        this.broadcastStatus(decoded.userId, true)

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString())
            this.handleMessage(ws, message)
          } catch (error) {
            console.error('处理消息错误:', error)
          }
        })

        ws.on('close', () => {
          if (ws.userId) {
            this.clients.delete(ws.userId)
            this.broadcastStatus(ws.userId, false)
          }
        })

        ws.on('pong', () => {
          ws.isAlive = true
        })

      } catch (error) {
        console.error('WebSocket连接错误:', error)
        ws.close()
      }
    })

    this.startHeartbeat()
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case 'chat':
        this.handleChatMessage(ws.userId, message.data)
        break
      case 'typing':
        this.broadcastTyping(ws.userId, message.data)
        break
      case 'read':
        this.handleReadMessage(ws.userId, message.data)
        break
      case 'heartbeat':
        this.sendToUser(ws.userId, { type: 'heartbeat', timestamp: Date.now() })
        break
    }
  }

  handleChatMessage(ws, message) {
    const { receiverId, content, type = 'text' } = message
    const senderId = ws.userId

    // 存储消息
    const messageData = {
      id: generateId(),
      senderId,
      receiverId,
      content,
      type,
      timestamp: Date.now()
    }

    // 发送给接收者
    this.sendToUser(receiverId, {
      type: 'chat',
      data: {
        ...messageData,
        isMine: false
      }
    })
  }

  broadcastStatus(userId, online) {
    const contacts = store.getUserContacts(userId)
    contacts.forEach(contact => {
      this.sendToUser(contact.id, {
        type: 'status',
        data: { userId, online }
      })
    })
  }

  broadcastTyping(userId, data) {
    const { receiverId } = data
    this.sendToUser(receiverId, {
      type: 'typing',
      data: { userId }
    })
  }

  handleReadMessage(userId, data) {
    const { chatId } = data
    store.markMessagesAsRead(userId, chatId)

    const chat = store.getChatById(userId, chatId)
    if (chat) {
      const otherUserId = chat.participants.find(id => id !== userId)
      if (otherUserId) {
        this.sendToUser(otherUserId, {
          type: 'read',
          data: { chatId }
        })
      }
    }
  }

  sendToUser(userId, message) {
    const client = this.clients.get(userId)
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  }

  getTokenFromUrl(url) {
    if (!url) return null
    const token = new URL(url, 'ws://localhost').searchParams.get('token')
    return token
  }

  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          if (ws.userId) {
            this.clients.delete(ws.userId)
            this.broadcastStatus(ws.userId, false)
          }
          return ws.terminate()
        }
        ws.isAlive = false
        ws.ping()
      })
    }, 30000)
  }
}

module.exports = { WebSocketService }