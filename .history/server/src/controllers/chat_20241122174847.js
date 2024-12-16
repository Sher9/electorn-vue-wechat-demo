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
      console.error('Get chats error:', error)
      res.status(500).json({
        code: 500,
        message: '获取聊天列表失败'
      })
    }
  },

  // 发送消息
  sendMessage: async (req, res) => {
    try {
      const { receiverId, content, type = 'text' } = req.body
      const message = await store.addMessage({
        senderId: req.user.userId,
        receiverId,
        content,
        type
      })

      // 通过WebSocket推送消息
      const wss = req.app.get('wss')
      if (wss) {
        wss.sendToUser(receiverId, {
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
      console.error('Get messages error:', error)
      res.status(500).json({
        code: 500,
        message: '获取消息失败'
      })
    }
  },

  // 创建群聊
  createGroup: async (req, res) => {
    try {
      const { name, memberIds } = req.body
      const group = await store.createGroup({
        name,
        members: [req.user.userId, ...memberIds],
        ownerId: req.user.userId
      })
      res.json({
        code: 200,
        data: group
      })
    } catch (error) {
      console.error('Create group error:', error)
      res.status(500).json({
        code: 500,
        message: '创建群聊失败'
      })
    }
  },

  // 获取群成员
  getGroupMembers: async (req, res) => {
    try {
      const { groupId } = req.params
      const members = await store.getGroupMembers(groupId)
      res.json({
        code: 200,
        data: members
      })
    } catch (error) {
      console.error('Get group members error:', error)
      res.status(500).json({
        code: 500,
        message: '获取群成员失败'
      })
    }
  },

  // 添加群成员
  addGroupMembers: async (req, res) => {
    try {
      const { groupId } = req.params
      const { memberIds } = req.body
      const result = await store.addGroupMembers(groupId, memberIds)
      res.json({
        code: 200,
        data: result
      })
    } catch (error) {
      console.error('Add group members error:', error)
      res.status(500).json({
        code: 500,
        message: '添加群成员失败'
      })
    }
  },

  // 移除群成员
  removeGroupMember: async (req, res) => {
    try {
      const { groupId, memberId } = req.params
      const result = await store.removeGroupMember(groupId, memberId)
      res.json({
        code: 200,
        data: result
      })
    } catch (error) {
      console.error('Remove group member error:', error)
      res.status(500).json({
        code: 500,
        message: '移除群成员失败'
      })
    }
  }
}

module.exports = chatController