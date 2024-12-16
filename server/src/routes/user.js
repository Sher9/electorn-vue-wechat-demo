const express = require('express')
const userController = require('../controllers/user')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// 用户登录
router.post('/login', userController.login)

// 获取用户信息
router.get('/info', authMiddleware, userController.getUserInfo)

// 更新用户信息
router.put('/info', authMiddleware, userController.updateUserInfo)

// 搜索用户
router.get('/search', userController.searchUser)

// 添加好友
router.post('/friend', userController.addFriend)

// 获取联系人列表
router.get('/contacts', authMiddleware, userController.getContacts)

module.exports = router