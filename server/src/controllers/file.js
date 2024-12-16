const path = require('path')
const { STATIC_URL } = require('../config')
const ResponseUtil = require('../utils/response')

const fileController = {
  uploadImage: (req, res) => {
    if (!req.file) {
      return res.status(400).json(ResponseUtil.error('没有上传文件'))
    }

    const fileUrl = `${STATIC_URL}/uploads/${req.file.filename}`

    res.json(ResponseUtil.success({
      url: fileUrl,
      name: req.file.originalname,
      size: req.file.size
    }))
  },

  uploadEmoji: (req, res) => {
    if (!req.file) {
      return res.status(400).json(ResponseUtil.error('没有上传文件'))
    }

    const fileUrl = `${STATIC_URL}/uploads/${req.file.filename}`

    res.json(ResponseUtil.success({
      url: fileUrl,
      name: req.file.originalname
    }))
  }
}

module.exports = fileController 