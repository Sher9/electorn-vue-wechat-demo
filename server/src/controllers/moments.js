const momentModel = require('../models/moments')
const ResponseUtil = require('../utils/response')

const momentsController = {
  // 获取朋友圈列表
  async getMoments(req, res) {
    try {
      const moments = await momentModel.getMoments()
      res.json(ResponseUtil.success(moments))
    } catch (error) {
      console.error('Get moments error:', error)
      res.status(500).json(ResponseUtil.error('获取朋友圈列表失败'))
    }
  },

  // 发布朋友圈
  async publishMoment(req, res) {
    try {
      const { content, images } = req.body
      const moment = await momentModel.createMoment(req.user.userId, content, images)
      res.json(ResponseUtil.success(moment))
    } catch (error) {
      console.error('Publish moment error:', error)
      res.status(500).json(ResponseUtil.error('发布朋友圈失败'))
    }
  },

  // 点赞/取消点赞
  async toggleLike(req, res) {
    try {
      const { momentId } = req.params
      await momentModel.toggleLike(momentId, req.user.userId)
      res.json(ResponseUtil.success(null))
    } catch (error) {
      console.error('Toggle like error:', error)
      res.status(500).json(ResponseUtil.error('操作失败'))
    }
  },

  // 添加评论
  async addComment(req, res) {
    try {
      const { momentId } = req.params
      const { content, replyTo } = req.body
      const userId = req.user.userId

      const comment = await momentModel.addComment(
        momentId,
        userId,
        content,
        replyTo
      )

      res.json(ResponseUtil.success(comment))
    } catch (error) {
      console.error('Add comment error:', error)
      res.status(500).json(ResponseUtil.error(error.message || '评论失败'))
    }
  },

  // 删除评论
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params
      const success = await momentModel.deleteComment(commentId, req.user.userId)

      if (!success) {
        res.status(403).json(ResponseUtil.error('无权删除该评论'))
      }

      res.json(ResponseUtil.success(null))
    } catch (error) {
      console.error('Delete comment error:', error)
      res.status(500).json(ResponseUtil.error('删除评论失败'))
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
      res.json(ResponseUtil.success({
        url: fileUrl
      }))
    } catch (error) {
      console.error('Upload image error:', error)
      res.status(500).json(ResponseUtil.error('上传图片失败'))
    }
  }
}

module.exports = momentsController