const db = require('../utils/db')
const { v4: uuidv4 } = require('uuid')

const momentModel = {
  // 获取朋友圈列表
  async getMoments() {
    const sql = `
      SELECT 
        m.*,
        u.username,
        u.avatar,
        GROUP_CONCAT(DISTINCT mi.url) as images,
        COUNT(DISTINCT ml.id) as like_count,
        COUNT(DISTINCT mc.id) as comment_count
      FROM moments m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN moment_images mi ON m.id = mi.moment_id
      LEFT JOIN moment_likes ml ON m.id = ml.moment_id
      LEFT JOIN moment_comments mc ON m.id = mc.moment_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
      LIMIT 50
    `
    const moments = await db.query(sql)

    // 获取每条朋友圈的点赞和评论详情
    for (let moment of moments) {
      // 获取点赞列表
      const likesSQL = `
        SELECT u.id, u.username, u.avatar
        FROM moment_likes ml
        JOIN users u ON ml.user_id = u.id
        WHERE ml.moment_id = ?
      `
      moment.likes = await db.query(likesSQL, [moment.id])

      // 获取评论列表
      const commentsSQL = `
        SELECT 
          mc.*,
          u.username,
          u.avatar,
          ru.username as reply_username
        FROM moment_comments mc
        JOIN users u ON mc.user_id = u.id
        LEFT JOIN moment_comments rmc ON mc.reply_to = rmc.id
        LEFT JOIN users ru ON rmc.user_id = ru.id
        WHERE mc.moment_id = ?
        ORDER BY mc.created_at ASC
      `
      moment.comments = await db.query(commentsSQL, [moment.id])

      // 处理图片列表
      moment.images = moment.images ? moment.images.split(',') : []
    }

    return moments
  },

  // 创建朋友圈
  async createMoment(userId, content, images) {
    return await db.transaction(async (conn) => {
      // 插入朋友圈
      const momentId = uuidv4()
      await conn.query(
        'INSERT INTO moments (id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
        [momentId, userId, content]
      )

      // 插入图片
      if (images && images.length) {
        const imageValues = images.map(url => [uuidv4(), momentId, url])
        await conn.query(
          'INSERT INTO moment_images (id, moment_id, url) VALUES ?',
          [imageValues]
        )
      }

      return this.getMomentById(momentId)
    })
  },

  // 获取单条朋友圈
  async getMomentById(momentId) {
    const sql = `
      SELECT 
        m.*,
        u.username,
        u.avatar,
        GROUP_CONCAT(mi.url) as images
      FROM moments m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN moment_images mi ON m.id = mi.moment_id
      WHERE m.id = ?
      GROUP BY m.id
    `
    const [moment] = await db.query(sql, [momentId])
    if (moment) {
      moment.images = moment.images ? moment.images.split(',') : []
    }
    return moment
  },

  // 点赞/取消点赞
  async toggleLike(momentId, userId) {
    // 检查是否已点赞
    const [like] = await db.query(
      'SELECT id FROM moment_likes WHERE moment_id = ? AND user_id = ?',
      [momentId, userId]
    )

    if (like) {
      // 取消点赞
      await db.query(
        'DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?',
        [momentId, userId]
      )
    } else {
      // 添加点赞
      await db.query(
        'INSERT INTO moment_likes (id, moment_id, user_id, created_at) VALUES (?, ?, ?, NOW())',
        [uuidv4(), momentId, userId]
      )
    }
  },

  // 添加评论
  async addComment(momentId, userId, content, replyToId = null) {
    const commentId = uuidv4()

    // 检查回复的评论是否存在
    if (replyToId) {
      const [replyComment] = await db.query(
        'SELECT id FROM moment_comments WHERE id = ?',
        [replyToId]
      )
      if (!replyComment) {
        throw new Error('回复的评论不存在')
      }
    }

    await db.query(
      `INSERT INTO moment_comments 
       (id, moment_id, user_id, content, reply_to, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [commentId, momentId, userId, content, replyToId]
    )

    // 返回新创建的评论
    const [comment] = await db.query(`
      SELECT 
        mc.*,
        u.username,
        u.avatar,
        ru.username as reply_username
      FROM moment_comments mc
      JOIN users u ON mc.user_id = u.id
      LEFT JOIN moment_comments rmc ON mc.reply_to = rmc.id
      LEFT JOIN users ru ON rmc.user_id = ru.id
      WHERE mc.id = ?
    `, [commentId])

    return comment
  },
  // 获取评论
  async getComments(momentId) {
    return await db.query(`
      SELECT 
        mc.*,
        u.username,
        u.avatar,
        ru.username as reply_username,
        ru.id as reply_user_id
      FROM moment_comments mc
      JOIN users u ON mc.user_id = u.id
      LEFT JOIN moment_comments rmc ON mc.reply_to = rmc.id
      LEFT JOIN users ru ON rmc.user_id = ru.id
      WHERE mc.moment_id = ?
      ORDER BY mc.created_at ASC
    `, [momentId])
  },

  // 删除评论
  async deleteComment(commentId, userId) {
    const [comment] = await db.query(
      'SELECT user_id FROM moment_comments WHERE id = ?',
      [commentId]
    )

    if (!comment || comment.user_id !== userId) {
      return false
    }

    await db.query('DELETE FROM moment_comments WHERE id = ?', [commentId])
    return true
  }
}

module.exports = momentModel