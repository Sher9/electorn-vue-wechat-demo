const db = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const dayjs = require('dayjs')

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const chatModel = {
  // 获取聊天列表
  async getChatList(userId) {
    const sql = `
SELECT
	c.id,
	c.user_id,
	c.participant_id,
	c.is_group,
	c.created_at,
	u.username AS name,
	u.avatar,
	g.NAME AS group_name,
	g.avatar AS group_avatar,
	g.id AS group_id,
	g.owner_id AS owner_id,
	(
	SELECT
		m.content 
	FROM
		messages m 
	WHERE
		(-- 群聊消息
			( c.is_group = 1 AND m.chat_id = c.id ) 
			OR -- 单聊消息：获取双方的最后一条消息
			(
				c.is_group = 0 
				AND (
					( m.sender_id = c.user_id AND m.receiver_id = c.participant_id ) 
					OR ( m.sender_id = c.participant_id AND m.receiver_id = c.user_id ) 
				)) 
		) 
	ORDER BY
		m.created_at DESC 
		LIMIT 1 
	) AS last_message,
	(
	SELECT
		m.type 
	FROM
		messages m 
	WHERE
		(
			( c.is_group = 1 AND m.chat_id = c.id ) 
			OR (
				c.is_group = 0 
				AND (
					( m.sender_id = c.user_id AND m.receiver_id = c.participant_id ) 
					OR ( m.sender_id = c.participant_id AND m.receiver_id = c.user_id ) 
				)) 
		) 
	ORDER BY
		m.created_at DESC 
		LIMIT 1 
	) AS last_message_type,
	(
	SELECT
		m.created_at 
	FROM
		messages m 
	WHERE
		(
			( c.is_group = 1 AND m.chat_id = c.id ) 
			OR (
				c.is_group = 0 
				AND (
					( m.sender_id = c.user_id AND m.receiver_id = c.participant_id ) 
					OR ( m.sender_id = c.participant_id AND m.receiver_id = c.user_id ) 
				)) 
		) 
	ORDER BY
		m.created_at DESC 
		LIMIT 1 
	) AS lastTime,
	(
	SELECT
		COUNT(*) 
	FROM
		messages m 
	WHERE
		m.chat_id = c.id 
		AND m.receiver_id = c.user_id 
		AND m.read_status = 0 
	) AS unreadCount 
FROM
	chats c
	LEFT JOIN users u ON c.participant_id = u.id
	LEFT JOIN chat_groups g ON c.group_id = g.id 
WHERE
	c.user_id = ?
ORDER BY
	lastTime DESC

  `
    const chats = await db.query(sql, [userId])
    return chats.map(chat => ({
      ...chat,
      messages: [],
      lastTime: chat.last_time ? formatTime(chat.last_time) : '',
      unreadCount: Number(chat.unread_count || 0)
    }))
  },
  // 获取单个聊天
  async getChatById(chatId) {
    const sql = `
      SELECT * FROM chats WHERE id = ?
    `
    const [chat] = await db.query(sql, [chatId])
    return chat
  },
  // 更新未读数
  async updateUnreadCount(chatId, userId) {
    const sql = `
        UPDATE messages 
        SET read_status = 0 
        WHERE chat_id = ? AND sender_id = ?
      `
    await db.query(sql, [chatId, userId])
  },
  // 获取消息列表
  async getMessages(userId, receiverId) {
    const sql = `
      SELECT 
        m.*,
        u.username as sender_name,
        u.avatar as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE (
        (m.sender_id = ? AND m.receiver_id = ?)
        OR 
        (m.sender_id = ? AND m.receiver_id = ?)
      )
      ORDER BY m.created_at ASC
      LIMIT 50
    `
    return await db.query(sql, [userId, receiverId, receiverId, userId])
  },

  //获取群消息列表
  async getGroupMessages(receiverId) {
    const sql = `
      SELECT
	      m.*,
	      u.username AS sender_name,
	      u.avatar AS sender_avatar 
      FROM
	      messages m
	    LEFT JOIN users u ON m.sender_id = u.id 
      WHERE
	      m.receiver_id = ?
      ORDER BY
	      m.created_at ASC 
	    LIMIT 50
    `
    return await db.query(sql, [receiverId])
  },

  // 发送消息
  async sendMessage(messageData) {
    const { chatId, senderId, content, type, receiverId } = messageData

    const id = uuidv4()
    await db.transaction(async (conn) => {
      // 插入消息
      await conn.query(
        'INSERT INTO messages (id, chat_id, sender_id, receiver_id, content, type, read_status,created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [id, chatId, senderId, receiverId, content, type, 1]
      )

      // 更新最后一条消息
      await conn.query(
        'UPDATE chats SET last_message_id = ? WHERE id = ?',
        [id, messageData.chatId]
      )
    })

    return this.getMessageById(id)
  },

  // 获取单条消息
  async getMessageById(id) {
    const sql = `
      SELECT 
        m.*,
        u.username as sender_name,
        u.avatar as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `
    const [message] = await db.query(sql, [id])
    return message
  },


  // 删除消息
  async deleteMessage(messageId, userId) {
    const sql = `
      DELETE FROM messages WHERE id = ? AND sender_id = ?
    `
    await db.query(sql, [messageId, userId])
  },

  // 查找已存在的聊天
  async findChatByParticipants(userId1, userId2) {
    const sql = `
      SELECT c.*, 
        u.username as name,
        u.avatar
      FROM chats c
      JOIN users u ON (
        CASE 
          WHEN c.user_id = ? THEN c.participant_id = u.id
          ELSE c.user_id = u.id
        END
      )
      WHERE (c.user_id = ? AND c.participant_id = ?)
         OR (c.user_id = ? AND c.participant_id = ?)
      LIMIT 1
    `;
    const [chat] = await db.query(sql, [userId1, userId1, userId2, userId2, userId1]);
    return chat;
  },

  // 创建新聊天
  async createChat(userId1, userId2) {
    return await db.transaction(async (conn) => {
      // 为双方创建聊天记录，使用不同的ID
      const chatId1 = uuidv4();
      const chatId2 = uuidv4();

      await conn.query(
        `INSERT INTO chats (id, user_id, participant_id, is_group, created_at,unread_count)
         VALUES (?, ?, ?, 0, NOW(),0), (?, ?, ?, 0, NOW(),0)`,
        [chatId1, userId1, userId2, chatId2, userId2, userId1]
      );

      // 返回第一个用户的聊天记录
      const [chat] = await conn.query(`
       SELECT 
          c.id,
          c.user_id,
          c.participant_id,
          c.is_group,
          c.last_message_id,
          c.unread_count,
          c.created_at,
          u.username as name,
          u.avatar
        FROM chats c
        JOIN users u ON c.participant_id = u.id
        WHERE c.id = ?
      `, [chatId1]);

      return chat[0]
    });
  },

  // 删除聊天
  async deleteChat(chatId, userId) {
    return await db.transaction(async (conn) => {
      // 删除消息
      await conn.query('DELETE FROM messages WHERE chat_id = ?', [chatId])
      // 删除聊天
      await conn.query('DELETE FROM chats WHERE id = ? AND user_id = ?', [chatId, userId])
    })
  },


  // 创建群聊
  async createGroup({ name, memberIds, ownerId }) {
    return await db.transaction(async (conn) => {
      // 创建群组记录
      const groupId = uuidv4()
      await conn.query(
        `INSERT INTO chat_groups (id, name, owner_id, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [groupId, name, ownerId]
      )

      // 为所有成员创建群聊记录
      const chatValues = memberIds.map(memberId => [
        uuidv4(),  // chat id
        memberId,      // user_id
        null,          // participant_id
        groupId,       // group_id
        1,             // is_group
        new Date()     // created_at
      ])

      await conn.query(
        `INSERT INTO chats (id, user_id, participant_id, group_id, is_group, created_at)
         VALUES ?`,
        [chatValues]
      )

      // 返回创建的群组信息
      const [group] = await conn.query(
        `SELECT 
          g.id,
          g.name as groupName,
          g.avatar as groupAvatar,
          g.owner_id as ownerId,
          g.created_at as createdAt,
          JSON_ARRAYAGG(c.user_id) as memberIds
         FROM chat_groups g
         JOIN chats c ON c.group_id = g.id
         WHERE g.id = ?
         GROUP BY g.id`,
        [groupId]
      )

      return {
        id: group.id,
        groupName: group.groupName,
        groupAvatar: group.groupAvatar,
        ownerId: group.ownerId,
        isGroup: true,
        messages: [],
        createdAt: group.createdAt
      }
    })
  },

  // 获取群成员
  async getGroupMembers(groupId) {
    const sql = `
      SELECT 
        u.id,
        u.username,
        u.avatar
      FROM users u
      JOIN chats c ON c.user_id = u.id
      WHERE c.group_id = ?
    `
    return await db.query(sql, [groupId])
  }
}

module.exports = chatModel