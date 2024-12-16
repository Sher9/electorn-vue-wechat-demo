const jwt = require('jsonwebtoken')
const userModel = require('../models/user')
const { store } = require('../store')
const { JWT_SECRET, TOKEN_EXPIRES_IN } = require('../config')
const ResponseUtil = require('../utils/response')
const { v4: uuidv4 } = require('uuid')
const userController = {
  // 用户登录
  async login(req, res) {
    try {
      const { username } = req.body
      //根据用户名获取用户
      let user = await userModel.getByUsername(username)
      // 生成token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRES_IN
      })
      // 设置token
      store.setUserToken(user.id, token)
      // 设置用户
      store.setUser(user)
      res.json(ResponseUtil.success({
        ...user,
        token
      }))
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({
        code: 500,
        message: '登录失败'
      })
    }
  },

  // 获取用户信息
  async getUserInfo(req, res) {
    try {
      const user = await userModel.getById(req.user.userId)
      if (!user) {
        return res.status(404).json(ResponseUtil.notFound('用户不存在'))
      }

      res.json(ResponseUtil.success(user))
    } catch (error) {
      console.error('Get user info error:', error)
      res.status(500).json(ResponseUtil.error('获取用户信息失败'))
    }
  },


  // 更新用户信息
  async updateUserInfo(req, res) {
    // 实现更新用户信息的功能
    try {
      const { username, avatar } = req.body
      const user = await userModel.updateUser(req.user.userId, { username, avatar })
      res.json(ResponseUtil.success(user))
    } catch (error) {
      console.error('Update user info error:', error)
      res.status(500).json(ResponseUtil.error('更新用户信息失败'))
    }
  },

  // 获取联系人列表
  async getContacts(req, res) {
    try {
      const contacts = await userModel.getContacts(req.user.userId)
      // 设置联系人列表
      store.setUserContacts(req.user.userId, contacts)
      res.json(ResponseUtil.success(contacts))
    } catch (error) {
      console.error('Get contacts error:', error)
      res.status(500).json(ResponseUtil.error('获取联系人列表失败'))
    }
  },


  // 搜索用户
  async searchUser(req, res) {
    try {
      const { username } = req.query

      // 不能搜索自己
      if (username === req.user.username) {
        return res.status(400).json(ResponseUtil.error('不能添加自己为好友'))
      }

      const user = await userModel.searchUser(username)

      if (!user) {
        return res.status(404).json(ResponseUtil.error('用户不存在'))
      }

      // 检查是否已经是好友
      const isFriend = await userModel.checkIsFriend(req.user.userId, user.id)

      res.json(ResponseUtil.success({
        ...user,
        isFriend
      }))
    } catch (error) {
      console.error('Search user error:', error)
      res.status(500).json(ResponseUtil.error('搜索用户失败'))
    }
  },

  // 添加好友
  async addFriend(req, res) {
    try {
      const { userId: friendId } = req.body

      // 不能添加自己
      if (friendId === req.user.userId) {
        return res.status(400).json(ResponseUtil.error('不能添加自己为好友'))
      }

      await userModel.addFriend(req.user.userId, friendId)
      res.json(ResponseUtil.success('success'))
    } catch (error) {
      console.error('Add friend error:', error)
      res.status(500).json(ResponseUtil.error('添加好友失败'))
    }
  },
  // 获取登录二维码
  async getLoginQRCode(req, res) {
    try {
      const code = uuidv4() // 生成唯一的二维码ID
      const qrcode = {
        code,
        createdAt: Date.now(),
        expired: false,
        scanned: false,
        confirmed: false,
        userId: 'u1'
      }

      // 存储二维码信息
      store.setQRCode(code, qrcode)

      res.json(ResponseUtil.success({ code }))
    } catch (error) {
      console.error('Generate QRCode error:', error)
      res.status(500).json(ResponseUtil.error('生成二维码失败'))
    }
  },
  // 扫描二维码
  async scanQRCode(req, res) {
    try {
      const { code } = req.params
      const qrcode = store.getQRCode(code)

      if (!qrcode || qrcode.expired) {
        return res.status(400).json(ResponseUtil.error('二维码已过期'))
      }

      // 更新扫码状态
      qrcode.scanned = true
      qrcode.userId = req.user.userId
      store.updateQRCode(code, qrcode)

      res.json(ResponseUtil.success(null))
    } catch (error) {
      console.error('Scan QRCode error:', error)
      res.status(500).json(ResponseUtil.error('扫码失败'))
    }
  },
  // 确认登录
  async confirmQRCode(req, res) {
    try {
      const { code } = req.params
      const qrcode = store.getQRCode(code)

      if (!qrcode || qrcode.expired) {
        return res.status(400).json(ResponseUtil.error('二维码已过期'))
      }

      // 更新确认状态
      qrcode.confirmed = true
      store.updateQRCode(code, qrcode)

      res.json(ResponseUtil.success(null))
    } catch (error) {
      console.error('Confirm QRCode error:', error)
      res.status(500).json(ResponseUtil.error('确认失败'))
    }
  },
  // 检查二维码状态
  async checkQRCode(req, res) {
    try {
      const { code } = req.params
      const qrcode = store.getQRCode(code)

      if (!qrcode) {
        return res.json(ResponseUtil.success({ status: 'expired' }))
      }

      // 检查是否过期
      const now = Date.now()
      if (now - qrcode.createdAt > 5 * 60 * 1000) {
        store.deleteQRCode(code)
        return res.json(ResponseUtil.success({ status: 'expired' }))
      }

      // 返回当前状态
      res.json(ResponseUtil.success({
        status: qrcode.confirmed ? 'confirmed' : (qrcode.scanned ? 'scanned' : 'pending'),
        userId: qrcode.userId
      }))
    } catch (error) {
      console.error('Check QRCode error:', error)
      res.status(500).json(ResponseUtil.error('检查二维码状态失败'))
    }
  },
  // 二维码登录
  async qrcodeLogin(req, res) {
    try {
      const { code } = req.body
      const qrcode = store.getQRCode(code)

      if (!qrcode || qrcode.expired) {
        return res.status(400).json(ResponseUtil.error('二维码已过期'))
      }

      if (!qrcode.confirmed) {
        return res.status(400).json(ResponseUtil.error('等待确认'))
      }

      const user = await userModel.getById(qrcode.userId)
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRES_IN
      })

      store.setUserToken(user.id, token)
      store.deleteQRCode(code)

      res.json(ResponseUtil.success({
        ...user,
        token
      }))
    } catch (error) {
      console.error('QRCode login error:', error)
      res.status(500).json(ResponseUtil.error('登录失败'))
    }
  }
}

module.exports = userController