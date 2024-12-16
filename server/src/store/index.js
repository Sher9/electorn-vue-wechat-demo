const Mock = require('mockjs')

const { Random } = Mock

class Store {
  constructor() {
    this.users = new Map()
    this.contacts = new Map()
    this.chats = new Map()
    this.tokens = new Map()
    this.qrcodes = new Map()
  }


  // 设置二维码
  setQRCode(code, data) {
    this.qrcodes.set(code, data)
  }

  // 获取二维码
  getQRCode(code) {
    return this.qrcodes.get(code)
  }

  // 删除二维码
  deleteQRCode(code) {
    this.qrcodes.delete(code)
  }

  // 更新二维码状态
  updateQRCode(code, updates) {
    const qrcode = this.qrcodes.get(code)
    if (qrcode) {
      Object.assign(qrcode, updates)
      this.qrcodes.set(code, qrcode)
    }
  }
  getUserByToken(token) {
    const userId = this.tokens.get(token)
    return userId ? this.users.get(userId) : undefined
  }

  setUserToken(userId, token) {
    for (const [oldToken, uid] of this.tokens) {
      if (uid === userId) {
        this.tokens.delete(oldToken)
      }
    }
    this.tokens.set(token, userId)
  }

  setUser(user) {
    this.users.set(user.id, user)
  }


  getUserById(id) {
    return this.users.get(id)
  }


  setUserContacts(userId, contacts) {
    this.contacts.set(userId, contacts)
  }

  getUserContacts(userId) {
    return this.contacts.get(userId) || []
  }

  addMessage(messageData) {
    ``
    const message = {
      id: Random.id(),
      timestamp: Date.now(),
      ...messageData
    }

    const chat = this.getChatById(message.senderId, message.receiverId) ||
      this.getChatById(message.receiverId, message.senderId)

    if (chat) {
      chat.messages.push(message)
      chat.lastMessage = message.content
      chat.lastTime = new Date(message.timestamp).toLocaleTimeString()
    }

    return message
  }


  getChatById(userId, chatId) {
    const userChats = this.getUserChats(userId)
    return userChats.find(chat =>
      chat.id === chatId ||
      (chat.participants && chat.participants.includes(chatId))
    )
  }

  markMessagesAsRead(userId, chatId) {
    const chat = this.getChatById(userId, chatId)
    if (chat) {
      chat.messages.forEach(msg => {
        if (msg.receiverId === userId && !msg.read) {
          msg.read = true
        }
      })
    }
  }

  getChatIdForUsers(user1, user2) {
    return [user1, user2].sort().join('-')
  }

  getOrCreateChat(chatId, participants) {
    let chat = this.chats.get(chatId)
    if (!chat) {
      chat = {
        id: chatId,
        participants,
        messages: [],
        isGroup: false,
        createdAt: Date.now()
      }
      this.chats.set(chatId, chat)
    }
    return chat
  }

  getUnreadCount(userId) {
    const unreadCounts = {}

    this.chats.forEach((chat, chatId) => {
      if (chat.participants.includes(userId)) {
        const count = chat.messages.filter(
          msg => msg.receiverId === userId && !msg.read
        ).length
        if (count > 0) {
          unreadCounts[chatId] = count
        }
      }
    })

    return unreadCounts
  }




  updateUser(userId, updates) {
    const user = this.getUserById(userId)
    if (!user) return null

    // 更新用户信息
    Object.assign(user, updates)
    this.users.set(userId, user)

    return user
  }

  createGroup(data) {
    const { name, members, ownerId } = data
    const group = {
      id: Random.id(),
      name,
      participants: members,
      messages: [],
      isGroup: true,
      groupName: name,
      groupAvatar: Random.image('100x100', Random.color(), 'Group'),
      ownerId,
      createdAt: Date.now()
    }

    // 为所有成员添加群聊
    members.forEach(memberId => {
      const userChats = this.getUserChats(memberId) || []
      userChats.push(group)
      this.chats.set(memberId, userChats)
    })

    return group
  }

  getGroupMembers(groupId) {
    const group = this.findGroupById(groupId)
    if (!group) return []

    return group.participants.map(userId => {
      const user = this.getUserById(userId)
      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      }
    })
  }

  addGroupMembers(groupId, memberIds) {
    const group = this.findGroupById(groupId)
    if (!group) return null

    // 添加新成员
    group.participants = [...new Set([...group.participants, ...memberIds])]

    // 为新成员添加群聊
    memberIds.forEach(memberId => {
      const userChats = this.getUserChats(memberId) || []
      if (!userChats.find(chat => chat.id === groupId)) {
        userChats.push(group)
        this.chats.set(memberId, userChats)
      }
    })

    return group
  }

  removeGroupMember(groupId, memberId) {
    const group = this.findGroupById(groupId)
    if (!group) return null

    // 移除成员
    group.participants = group.participants.filter(id => id !== memberId)

    // 从成员的聊天列表中移除群聊
    const userChats = this.getUserChats(memberId)
    if (userChats) {
      const updatedChats = userChats.filter(chat => chat.id !== groupId)
      this.chats.set(memberId, updatedChats)
    }

    return group
  }

  findGroupById(groupId) {
    for (const [_, chats] of this.chats) {
      const group = chats.find(chat => chat.id === groupId && chat.isGroup)
      if (group) return group
    }
    return null
  }

  getUserMentions(userId) {
    const mentions = []
    this.chats.forEach((chats) => {
      chats.forEach(chat => {
        if (chat.isGroup) {
          chat.messages.forEach(msg => {
            if (msg.mentions && msg.mentions.includes(userId) && !msg.read) {
              mentions.push({
                chatId: chat.id,
                messageId: msg.id,
                senderId: msg.senderId,
                content: msg.content,
                timestamp: msg.timestamp
              })
            }
          })
        }
      })
    })
    return mentions
  }
}

module.exports = {
  store: new Store()
} 