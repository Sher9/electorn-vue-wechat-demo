const chatController = {
  // 获取聊天列表
  getChats: async (req, res) => {
    try {
      const chats = await store.getUserChats(req.user.userId)
      res.json({
        code: 200,
        data: chats
      })
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取聊天列表失败'
      })
    }
  },

  // 发送消息
  sendMessage: async (req, res) => {
    try {
      const { receiverId, content, type } = req.body
      const message = await store.addMessage({
        senderId: req.user.userId,
        receiverId,
        content,
        type
      })
      res.json({
        code: 200,
        data: message
      })
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '发送消息失败'
      })
    }
  },

  // 获取消息列表
  getMessages: async (req, res) => {
    try {
      const { chatId } = req.params
      const messages = await store.getChatMessages(chatId)
      res.json({
        code: 200,
        data: {
          list: messages,
          total: messages.length
        }
      })
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取消息失败'
      })
    }
  }
}

module.exports = chatController