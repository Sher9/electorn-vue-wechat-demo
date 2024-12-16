import request from '@/utils/request'
import type { User, Contact, UploadResult, ApiResponse } from '@/types'

export const userApi = {
  login(data: { username: string }) {
    return request.post<ApiResponse<User>>('/api/user/login', data)
  },

  getUserInfo() {
    return request.get<ApiResponse<User>>('/api/user/info')
  },

  getUserInfoByName(username: string) {
    return request.get<ApiResponse<User>>(`/api/user/${username}`)
  },

  getContacts() {
    return request.get<ApiResponse<Contact[]>>('/api/user/contacts')
  },

  updateUserInfo(data: { username: string; avatar: string }) {
    return request.put<ApiResponse<User>>('/api/user/info', data)
  },

  uploadAvatar(formData: FormData) {
    return request.post<ApiResponse<UploadResult>>('/api/user/avatar', formData)
  },

  // 搜索用户
  searchUser(username: string) {
    return request.get<ApiResponse<User>>(`/api/user/search?username=${username}`)
  },

  // 添加好友
  addFriend(userId: string) {
    return request.post<ApiResponse<void>>('/api/user/friend', { userId })
  },

  // 获取登录二维码
  getLoginQRCode() {
    return request.get<ApiResponse<{ code: string }>>('/api/user/qrcode')
  },

  // 二维码登录
  qrcodeLogin(code: string) {
    return request.post<ApiResponse<User>>('/api/user/qrcode/login', { code })
  },

  // 检查二维码状态
  checkQRCode(code: string) {
    return request.get<ApiResponse<{
      status: 'pending' | 'scanned' | 'confirmed' | 'expired'
      userId?: string
    }>>(`/api/user/qrcode/check/${code}`)
  },
  // 确认二维码登录
  confirmQRCode(code: string) {
    return request.post<ApiResponse<void>>(`/api/user/qrcode/confirm/${code}`)
  }
}