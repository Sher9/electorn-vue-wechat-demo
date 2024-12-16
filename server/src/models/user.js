const db = require('../utils/db')
const { v4: uuidv4 } = require('uuid')

const userModel = {
  // 创建用户
  async create(userData) {
    const id = db.generateId()
    const sql = `
      INSERT INTO users (id, username, avatar, created_at)
      VALUES (?, ?, ?, NOW())
    `
    await db.query(sql, [id, userData.username, userData.avatar])
    return this.getById(id)
  },

  //根据用户名获取用户
  async getByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?'
    const users = await db.query(sql, [username])
    return users[0]
  },

  // 根据ID获取用户
  async getById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?'
    const users = await db.query(sql, [id])
    return users[0]
  },


  // 更新用户信息
  async updateUser(userId, userData) {
    const sql = `
        UPDATE users 
        SET username = ?, avatar = ?, updated_at = NOW()
        WHERE id = ?
      `
    await db.query(sql, [userData.username, userData.avatar, userId])
    return this.getById(userId)
  },

  // 搜索用户
  async searchUser(username) {
    const sql = `
      SELECT id, username, avatar 
      FROM users 
      WHERE username LIKE ? 
      LIMIT 1
    `
    const [user] = await db.query(sql, [`%${username}%`])
    return user
  },

  // 检查是否已经是好友
  async checkIsFriend(userId, friendId) {
    const sql = `
      SELECT id FROM contacts 
      WHERE user_id = ? AND contact_id = ?
    `
    const [contact] = await db.query(sql, [userId, friendId])
    return !!contact
  },




  // 添加好友
  async addFriend(userId, friendId) {
    // 检查是否已经是好友
    const isFriend = await this.checkIsFriend(userId, friendId)
    if (isFriend) {
      throw new Error('已经是好友了')
    }

    // 开启事务
    return await db.transaction(async (conn) => {
      // 互相添加好友关系
      await conn.query(
        'INSERT INTO contacts (id, user_id, contact_id, created_at) VALUES (?, ?, ?, NOW()), (?, ?, ?, NOW())',
        [uuidv4(), userId, friendId, uuidv4(), friendId, userId]
      )

      // 创建聊天
      const chatId1 = uuidv4()
      const chatId2 = uuidv4()
      await conn.query(
        'INSERT INTO chats (id, user_id, participant_id, is_group, created_at) VALUES (?, ?, ?, 0, NOW()), (?, ?, ?, 0, NOW())',
        [chatId1, userId, friendId, chatId2, friendId, userId]
      )

      // 返回创建的聊天
      const [chat] = await conn.query(`
          SELECT c.*, u.username as name, u.avatar
          FROM chats c
          JOIN users u ON c.participant_id = u.id
          WHERE c.id = ?
        `, [chatId1])

      return chat
    })
  },

  // 获取用户联系人
  async getContacts(userId) {
    const sql = `
      SELECT u.* 
      FROM users u
      INNER JOIN contacts c ON u.id = c.contact_id
      WHERE c.user_id = ?
    `
    return await db.query(sql, [userId])
  },

  // 添加联系人
  async addContact(userId, contactId) {
    const id = db.generateId()
    const sql = `
      INSERT INTO contacts (id, user_id, contact_id, created_at)
      VALUES (?, ?, ?, NOW())
    `
    await db.query(sql, [id, userId, contactId])
    return true
  }
}

module.exports = userModel