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
router.get('/user/qrcode', userController.getLoginQRCode)
router.post('/user/qrcode/login', userController.qrcodeLogin)
router.get('/user/qrcode/check/:code', userController.checkQRCode)
router.get('/user/qrcode/confirm/:code', userController.confirmQRCode) 

// 其他需要认证的路由
router.use('/user', authMiddleware, userRoutes)
router.use('/chat', authMiddleware, chatRoutes)
router.use('/file', authMiddleware, fileRoutes)
router.use('/moments', authMiddleware, momentsRoutes)
module.exports = router 