const ResponseUtil = require('../utils/response')
const errorHandler = (err, req, res, next) => {
  console.error(err.stack)

  res.status(err.status || 500).json(
    ResponseUtil.error(err.message || '服务器内部错误', err.status || 500)
  )
}

const notFoundHandler = (req, res) => {
  res.status(404).json(ResponseUtil.notFound('接口不存在'))
}

module.exports = {
  errorHandler,
  notFoundHandler
} 