const express = require('express')
const momentsController = require('../controllers/moments')
const upload = require('../middleware/upload')

const router = express.Router()

// 获取朋友圈列表
router.get('/list', momentsController.getMoments)

// 发布朋友圈
router.post('/', momentsController.publishMoment)

// 上传朋友圈图片
router.post('/upload', upload.single('file'), (req, res) => {
    momentsController.uploadImage(req, res)
})


// 点赞/取消点赞
router.post('/:momentId/like', momentsController.toggleLike)

// 评论
router.post('/:momentId/comment', momentsController.addComment)

// 删除评论
router.delete('/:momentId/comment/:commentId', momentsController.deleteComment)

module.exports = router