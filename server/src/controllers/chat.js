const chatModel = require('../models/chat')
const userModel = require('../models/user')
const ResponseUtil = require('../utils/response')


// 添加格式化时间函数
const formatChatTime = (date) => {
  const messageDate = new Date(date)
  const now = new Date()

  // 转换为当天0点
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const beforeYesterday = new Date(today)
  beforeYesterday.setDate(beforeYesterday.getDate() - 2)

  // 获取本周一
  const monday = new Date(today)
  monday.setDate(monday.getDate() - monday.getDay() + 1)

  // 如果是今天，显示时分
  if (messageDate >= today) {
    return messageDate.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // 如果是昨天
  if (messageDate >= yesterday) {
    return '昨天'
  }

  // 如果是前天
  if (messageDate >= beforeYesterday) {
    return '前天'
  }

  // 如果是本周
  if (messageDate >= monday) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[messageDate.getDay()]
  }

  // 其他情况显示年月日
  return messageDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}



const chatController = {
  // 创建或获取聊天
  async createChat(req, res) {
    try {
      const { participantId } = req.body
      const userId = req.user.userId

      // 检查是否已经存在聊天
      let chat = await chatModel.findChatByParticipants(userId, participantId)

      if (!chat) {
        // 创建新聊天
        chat = await chatModel.createChat(userId, participantId)
      }

      res.json(ResponseUtil.success({
        ...chat,
        lastTime: formatChatTime(chat.lastTime || new Date()),
        unreadCount: 0,
        messages: []
      }))
    } catch (error) {
      console.error('Create chat error:', error)
      res.status(500).json(ResponseUtil.error('创建聊天失败'))
    }
  },
  // 获取聊天列表
  getChats: async (req, res) => {
    try {
      const chats = await chatModel.getChatList(req.user.userId)
      res.json(ResponseUtil.success(chats))
    } catch (error) {
      console.error('Get chats error:', error)
      res.status(500).json(ResponseUtil.error('获取聊天列表失败'))
    }
  },

  // 获取消息列表
  getMessages: async (req, res) => {
    try {
      const { chatId } = req.params
      const userId = req.user.userId
      console.log(userId)
      // 获取消息的同时更新未读数
      await chatModel.updateUnreadCount(chatId, userId)
      //根据chatId获取receiverId
      const chat = await chatModel.getChatById(chatId)
      const receiverId = chat.is_group === 1 ? chat.group_id : chat.participant_id
      console.log(receiverId)
      let messages = []
      if (chat.is_group) {
        messages = await chatModel.getGroupMessages(receiverId)
      } else {
        messages = await chatModel.getMessages(userId, receiverId)
      }
      res.json(ResponseUtil.success({
        list: messages,
        total: messages.length
      }))
    } catch (error) {
      console.error('Get messages error:', error)
      res.status(500).json(ResponseUtil.error('获取消息失败'))
    }
  },

  // 发送消息
  sendMessage: async (req, res) => {
    try {
      const { chatId, receiverId, content, type = 'text' } = req.body
      const senderId = req.user.userId
      const message = await chatModel.sendMessage({
        chatId: chatId,
        senderId,
        receiverId,
        content,
        type
      })
      // 获取群聊信息
      const chat = await chatModel.getChatById(chatId)
      // 通过 WebSocket 推送消息给接收者
      const wss = req.app.get('wss')

      if (chat.is_group) {
        // 如果是群聊，获取所有群成员
        const members = await chatModel.getGroupMembers(chat.group_id)
        // 给所有群成员(除了发送者)推送消息
        members.forEach(member => {
          if (member.id !== senderId) {
            wss.sendToUser(member.id, {
              type: 'chat',
              data: {
                ...message,
                chatId,
                isMine: false,
                senderName: req.user.username,
                senderAvatar: req.user.avatar,
                isGroup: true,
                groupId: chat.group_id,
                groupName: chat.group_name,
                time: new Date(message.timestamp).toLocaleTimeString()
              }
            })
          }
        })
      } else {
        wss.sendToUser(receiverId, {
          type: 'chat',
          data: {
            ...message,
            isMine: false,
            senderName: req.user.username,
            senderAvatar: req.user.avatar,
            time: new Date(message.timestamp).toLocaleTimeString()
          }
        })
      }

      res.json(ResponseUtil.success(message))
    } catch (error) {
      console.error('Send message error:', error)
      res.status(500).json(ResponseUtil.error('发送消息失败'))
    }
  },
  // 删除消息
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params
      const userId = req.user.userId

      // 获取消息信息
      const message = await chatModel.getMessageById(messageId)
      if (!message) {
        return res.status(404).json(ResponseUtil.error('消息不存在'))
      }
      // 删除消息
      await chatModel.deleteMessage(messageId, userId)

      // 获取聊天信息
      const chat = await chatModel.getChatById(message.chat_id)
      const wss = req.app.get('wss')
      // 通知其他用户更新消息列表
      if (chat.is_group) {
        // 群聊：通知所有群成员
        const members = await chatModel.getGroupMembers(chat.group_id)
        members.forEach(member => {
          if (member.id !== userId) {
            wss.sendToUser(member.id, {
              type: 'messageDeleted',
              data: {
                messageId,
                chatId: message.chat_id,
                senderId: chat.group_id
              }
            })
          }
        })
      } else {
        // 单聊：通知对方
        const receiverId = chat.participant_id
        wss.sendToUser(receiverId, {
          type: 'messageDeleted',
          data: {
            messageId,
            chatId: message.chat_id,
            senderId: userId
          }
        })
      }


      res.json(ResponseUtil.success(null, '删除成功'))
    } catch (error) {
      console.error('Delete message error:', error)
      res.status(500).json(ResponseUtil.error('删除消息失败'))
    }
  },
  // 创建群聊
  createGroup: async (req, res) => {
    try {
      const { name, memberIds } = req.body
      const group = await chatModel.createGroup({
        name,
        memberIds,
        ownerId: req.user.userId
      })
      res.json(ResponseUtil.success(group))
    } catch (error) {
      console.error('Create group error:', error)
      res.status(500).json(ResponseUtil.error('创建群聊失败'))

    }
  },

  // 获取群成员
  getGroupMembers: async (req, res) => {
    try {
      const { groupId } = req.params
      const members = await chatModel.getGroupMembers(groupId)
      res.json(ResponseUtil.success(members))
    } catch (error) {
      console.error('Get group members error:', error)
      res.status(500).json(ResponseUtil.error('获取群成员失败'))
    }
  },

  // 添加群成员
  addGroupMembers: async (req, res) => {
    try {
      const { groupId } = req.params
      const { memberIds } = req.body
      const group = await chatModel.addGroupMembers(groupId, memberIds)
      res.json(ResponseUtil.success(group))
    } catch (error) {
      console.error('Add group members error:', error)
      res.status(500).json(ResponseUtil.error('添加群成员失败'))
    }
  },

  // 移除群成员
  removeGroupMember: async (req, res) => {
    try {
      const { groupId, memberId } = req.params
      const group = await chatModel.removeGroupMember(groupId, memberId)
      res.json(ResponseUtil.success(group))
    } catch (error) {
      console.error('Remove group member error:', error)
      res.status(500).json(ResponseUtil.error('移除群成员失败'))
    }
  },

  // 删除聊天
  async deleteChat(req, res) {
    try {
      const { chatId } = req.params
      await chatModel.deleteChat(chatId, req.user.userId)
      res.json(ResponseUtil.success(null))
    } catch (error) {
      console.error('Delete chat error:', error)
      res.status(500).json(ResponseUtil.error('删除聊天失败'))
    }
  },
  // 处理通话信令
  handleCallSignal: async (req, res) => {
    try {
      const { receiverId, type, sdp, candidate, isVideo } = req.body
      const senderId = req.user.userId

      // 获取发送者信息
      const sender = await userModel.getById(senderId)

      // 通过 WebSocket 推送信令
      const wss = req.app.get('wss')
      console.log("senderId", senderId)
      console.log("receiverId", receiverId)
      console.log("sender", sender)
      wss.sendToUser(receiverId, {
        type: 'call',
        data: {
          type,
          senderId,
          senderName: sender.username,
          senderAvatar: sender.avatar,
          sdp,
          candidate,
          isVideo
        }
      })

      res.json(ResponseUtil.success('信令已发送'))
    } catch (error) {
      console.error('Handle call signal error:', error)
      res.status(500).json(ResponseUtil.error('发送信令失败'))
    }
  }
}

module.exports = chatController