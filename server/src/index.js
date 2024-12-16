const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const { createServer } = require('http')
const { WebSocketService } = require('./websocket')
const routes = require('./routes')
const { errorHandler, notFoundHandler } = require('./middleware/error')
const logger = require('./utils/logger')
const { PORT, CORS_ORIGIN } = require('./config')

const app = express()
const server = createServer(app)

// 初始化WebSocket服务
const wss = new WebSocketService(server)
// 将 WebSocket 实例添加到 app
app.set('wss', wss)

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(bodyParser.json())

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API路由
app.use('/api', routes)

// 错误处理
app.use(notFoundHandler)
app.use(errorHandler)

// 启动服务器
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

// 优雅关闭
const gracefulShutdown = () => {
  logger.info('Received shutdown signal')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason)
}) 