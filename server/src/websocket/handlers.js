const { store } = require('../store')
const { formatResponse } = require('../utils')

const handlers = {

  // 处理通话相关的信令
  handleCallSignaling(ws, data) {
    const { type, target, payload } = data

    switch (type) {
      case 'call-offer': // 发起通话
        this.handleCallOffer(ws.userId, target, payload)
        break
      case 'call-answer': // 接听通话
        this.handleCallAnswer(ws.userId, target, payload)
        break
      case 'call-candidate': // ICE候选者
        this.handleCallCandidate(ws.userId, target, payload)
        break
      case 'call-end': // 结束通话
        this.handleCallEnd(ws.userId, target)
        break
    }
  },

  // 处理通话请求
  handleCallOffer(senderId, targetId, { sdp, isVideo }) {
    const sender = store.getUserById(senderId)
    this.sendToUser(targetId, {
      type: 'call',
      data: {
        type: 'offer',
        senderId,
        senderName: sender.username,
        senderAvatar: sender.avatar,
        sdp,
        isVideo
      }
    })
  },

  // 处理接听响应
  handleCallAnswer(senderId, targetId, { sdp }) {
    this.sendToUser(targetId, {
      type: 'call',
      data: {
        type: 'answer',
        senderId,
        sdp
      }
    })
  },

  // 处理ICE候选者
  handleCallCandidate(senderId, targetId, { candidate }) {
    this.sendToUser(targetId, {
      type: 'call',
      data: {
        type: 'candidate',
        senderId,
        candidate
      }
    })
  },

  // 处理通话结束
  handleCallEnd(senderId, targetId) {
    this.sendToUser(targetId, {
      type: 'call',
      data: {
        type: 'end',
        senderId
      }
    })
  },

  // 处理聊天消息
  chat: (ws, data) => {
    const { receiverId, content, type = 'text' } = data

    const message = store.addMessage({
      senderId: ws.userId,
      receiverId,
      content,
      type,
      timestamp: Date.now()
    })

    // 发送给接收者
    ws.wss.sendToUser(receiverId, {
      type: 'chat',
      data: message
    })

    // 发送确认给发送者
    ws.wss.sendToUser(ws.userId, {
      type: 'sent',
      data: {
        messageId: message.id
      }
    })
  },

  // 处理正在输入状态
  typing: (ws, data) => {
    const { receiverId } = data
    ws.wss.sendToUser(receiverId, {
      type: 'typing',
      data: {
        userId: ws.userId
      }
    })
  },

  // 处理消息已读状态
  read: (ws, data) => {
    const { chatId } = data
    store.markMessagesAsRead(ws.userId, chatId)

    const chat = store.getChatById(ws.userId, chatId)
    if (chat) {
      const otherUserId = chat.participants.find(id => id !== ws.userId)
      if (otherUserId) {
        ws.wss.sendToUser(otherUserId, {
          type: 'read',
          data: {
            chatId,
            userId: ws.userId
          }
        })
      }
    }
  },

  // 处理心跳
  heartbeat: (ws) => {
    ws.wss.sendToUser(ws.userId, {
      type: 'heartbeat',
      data: {
        timestamp: Date.now()
      }
    })
  }
}

module.exports = handlers 