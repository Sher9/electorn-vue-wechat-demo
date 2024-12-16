const chatModel = require('../models/chat')

const chatController = {
  // 获取聊天列表
  async getChats(req, res) {
    try {
      const chats = await chatModel.getUserChats(req.user.userId)
      res.json({
        code: 200,
        data: chats
      })
    } catch (error) {
      console.error('Get chats error:', error)
      res.status(500).json({
        code: 500,
        message: '获取聊天列表失败'
      })
    }
  },

  // 获取聊天消息
  async getMessages(req, res) {
    try {
      const messages = await chatModel.getMessages(req.params.chatId)
      res.json({
        code: 200,
        data: {
          list: messages,
          total: messages.length
        }
      })
    } catch (error) {
      console.error('Get messages error:', error)
      res.status(500).json({
        code: 500,
        message: '获取聊天消息失败'
      })
    }
  },

  // 发送消息
  async sendMessage(req, res) {
    try {
      const message = await chatModel.sendMessage({
        senderId: req.user.userId,
        ...req.body
      })

      // 通过WebSocket推送消息
      const wss = req.app.get('wss')
      if (wss) {
        wss.sendToUser(req.body.receiverId, {
          type: 'chat',
          data: message
        })
      }

      res.json({
        code: 200,
        data: message
      })
    } catch (error) {
      console.error('Send message error:', error)
      res.status(500).json({
        code: 500,
        message: '发送消息失败'
      })
    }
  }
}

module.exports = chatController