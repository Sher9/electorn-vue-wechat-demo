const express = require('express')
const userRoutes = require('./user')
const chatRoutes = require('./chat')
const fileRoutes = require('./file')
const momentsRoutes = require('./moments')
const authMiddleware = require('../middleware/auth')
const userController = require('../controllers/user')

const router = express.Router()

// 登录路由单独处理，不需要认证
router.post('/user/login', userController.login)

// 其他需要认证的路由
router.use('/user', authMiddleware, userRoutes)
router.use('/chat', authMiddleware, chatRoutes)
router.use('/file', authMiddleware, fileRoutes)
router.use('/moments', authMiddleware, momentsRoutes)
module.exports = router 