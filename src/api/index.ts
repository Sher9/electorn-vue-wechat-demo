import request from '@/utils/request'
import type { User, Contact, Message, Chat, UploadResult, ApiResponse } from '@/types'

export const api = {
  // 用户相关
  login(data: { username: string; password: string }) {
    return request.post<ApiResponse<User>>('/api/user/login', data)
  },

  getUserInfo() {
    return request.get<ApiResponse<User>>('/api/user/info')
  },

  updateUserInfo(data: Partial<User>) {
    return request.put<ApiResponse<User>>('/api/user/info', data)
  },

  // 联系人相关
  getContacts() {
    return request.get<ApiResponse<Contact[]>>('/api/user/contacts')
  },

  searchContacts(keyword: string) {
    return request.get<ApiResponse<Contact[]>>('/api/user/search', { params: { keyword } })
  },

  // 聊天相关
  getChats() {
    return request.get<ApiResponse<Chat[]>>('/api/chat/list')
  },

  getMessages(chatId: string, params: { page: number; size: number }) {
    return request.get<ApiResponse<Message[]>>(`/api/chat/${chatId}/messages`, { params })
  },

  sendMessage(chatId: string, data: { content: string; type: string }) {
    return request.post<ApiResponse<Message>>(`/api/chat/${chatId}/message`, data)
  },

  // 文件上传
  uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<ApiResponse<UploadResult>>('/api/file/upload/image', formData)
  },

  uploadEmoji(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<ApiResponse<UploadResult>>('/api/file/upload/emoji', formData)
  }
} 