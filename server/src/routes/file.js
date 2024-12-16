const express = require('express')
const upload = require('../middleware/upload')
const fileController = require('../controllers/file')

const router = express.Router()

// 上传图片
router.post('/upload/image', upload.single('file'), fileController.uploadImage)

// 上传表情
router.post('/upload/emoji', upload.single('file'), fileController.uploadEmoji)

module.exports = router