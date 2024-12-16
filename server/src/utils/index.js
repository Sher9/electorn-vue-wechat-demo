const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

// 生成随机ID
const generateId = () => {
  return crypto.randomBytes(16).toString('hex')
}

// 确保目录存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// 获取文件扩展名
const getFileExt = (filename) => {
  return path.extname(filename).toLowerCase()
}

// 生成唯一文件名
const generateFileName = (originalname) => {
  const ext = getFileExt(originalname)
  return `${generateId()}${ext}`
}

// 格式化日期时间
const formatDateTime = (date = new Date()) => {
  return date.toISOString()
}

// 格式化响应数据
const formatResponse = (data = null, code = 200, message = 'success') => {
  return {
    code,
    data,
    message
  }
}

// 错误响应
const errorResponse = (message = 'error', code = 500) => {
  return formatResponse(null, code, message)
}

module.exports = {
  generateId,
  ensureDir,
  getFileExt,
  generateFileName,
  formatDateTime,
  formatResponse,
  errorResponse
} 