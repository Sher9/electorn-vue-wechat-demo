const express = require('express')
const chatController = require('../controllers/chat')

const router = express.Router()

// 获取聊天列表
router.get('/list', chatController.getChats)

// 获取聊天消息历史
router.get('/messages/:chatId', chatController.getMessages)

// 发送消息
router.post('/message', chatController.sendMessage)

// 创建群聊
router.post('/group', chatController.createGroup)

// 获取群成员
router.get('/group/:groupId/members', chatController.getGroupMembers)

// 添加群成员
router.post('/group/:groupId/members', chatController.addGroupMembers)

// 移除群成员
router.delete('/group/:groupId/members/:memberId', chatController.removeGroupMember)

module.exports = router 