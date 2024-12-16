const logger = require('../utils/logger')

const loggerMiddleware = (req, res, next) => {
  const start = Date.now()
  
  // 请求结束后记录日志
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.access(req, res, duration)
  })

  next()
}

module.exports = loggerMiddleware 