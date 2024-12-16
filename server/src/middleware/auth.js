const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config')
const { store } = require('../store')
const userModel = require('../models/user')
const ResponseUtil = require('../utils/response')

const authMiddleware = (req, res, next) => {

  // 获取 token
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json(ResponseUtil.unauthorized('未提供认证信息'))

  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json(ResponseUtil.unauthorized('无效的认证格式'))
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET)

    // 检查用户是否存在
    const user = userModel.getById(decoded.userId)
    if (!user) {
      return res.status(401).json(ResponseUtil.unauthorized('用户不存在'))
    }
    // 检查 token 是否是最新的
    const currentToken = store.tokens.get(token)
    if (currentToken !== decoded.userId) {
      return res.status(401).json(ResponseUtil.unauthorized('token已失效'))
    }

    // 将用户信息添加到请求对象
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(ResponseUtil.unauthorized('token已过期'))
    }

    res.status(401).json(ResponseUtil.unauthorized('无效的token'))
  }
}

module.exports = authMiddleware 