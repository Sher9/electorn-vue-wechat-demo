const { v4: uuidv4 } = require('uuid')
const db = require('../utils/db')

const momentsController = {
    // 获取朋友圈列表
    async getMoments(req, res) {
        try {
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

            res.json({
                code: 200,
                data: moments
            })
        } catch (error) {
            console.error('Get moments error:', error)
            res.status(500).json({
                code: 500,
                message: '获取朋友圈列表失败'
            })
        }
    },

    // 发布朋友圈
    async publishMoment(req, res) {
        try {
            const { content, images } = req.body
            const userId = req.user.userId

            // 开始事务
            await db.transaction(async (conn) => {
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

                res.json({
                    code: 200,
                    data: {
                        id: momentId,
                        content,
                        images: images || [],
                        userId,
                        createdAt: new Date()
                    }
                })
            })
        } catch (error) {
            console.error('Publish moment error:', error)
            res.status(500).json({
                code: 500,
                message: '发布朋友圈失败'
            })
        }
    },

    // 上传图片
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    code: 400,
                    message: '没有上传文件'
                })
            }

            const fileUrl = `/uploads/${req.file.filename}`
            res.json({
                code: 200,
                data: {
                    url: fileUrl
                }
            })
        } catch (error) {
            console.error('Upload image error:', error)
            res.status(500).json({
                code: 500,
                message: '上传图片失败'
            })
        }
    },

    // 点赞/取消点赞
    async toggleLike(req, res) {
        try {
            const { momentId } = req.params
            const userId = req.user.userId

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

            res.json({
                code: 200,
                data: null
            })
        } catch (error) {
            console.error('Toggle like error:', error)
            res.status(500).json({
                code: 500,
                message: '操作失败'
            })
        }
    },

    // 添加评论
    async addComment(req, res) {
        try {
            const { momentId } = req.params
            const { content, replyTo } = req.body
            const userId = req.user.userId

            const commentId = uuidv4()
            await db.query(
                'INSERT INTO moment_comments (id, moment_id, user_id, content, reply_to, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [commentId, momentId, userId, content, replyTo]
            )

            res.json({
                code: 200,
                data: {
                    id: commentId,
                    content,
                    userId,
                    replyTo,
                    createdAt: new Date()
                }
            })
        } catch (error) {
            console.error('Add comment error:', error)
            res.status(500).json({
                code: 500,
                message: '评论失败'
            })
        }
    },

    // 删除评论
    async deleteComment(req, res) {
        try {
            const { momentId, commentId } = req.params
            const userId = req.user.userId

            // 检查是否有权限删除
            const [comment] = await db.query(
                'SELECT user_id FROM moment_comments WHERE id = ?',
                [commentId]
            )

            if (!comment || comment.user_id !== userId) {
                return res.status(403).json({
                    code: 403,
                    message: '无权删除该评论'
                })
            }

            await db.query('DELETE FROM moment_comments WHERE id = ?', [commentId])

            res.json({
                code: 200,
                data: null
            })
        } catch (error) {
            console.error('Delete comment error:', error)
            res.status(500).json({
                code: 500,
                message: '删除评论失败'
            })
        }
    }
}

module.exports = momentsController