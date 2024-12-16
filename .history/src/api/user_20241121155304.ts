import request from '@/utils/request'
import type { User, Contact, ApiResponse } from '@/types'

export const userApi = {
  login(data: { username: string }) {
    return request.post<ApiResponse<User>>('/api/user/login', data)
  },

  getUserInfo() {
    return request.get<ApiResponse<User>>('/api/user/info')
  },

  getContacts() {
    return request.get<ApiResponse<Contact[]>>('/api/user/contacts')
  },

  updateUserInfo(data: { username?: string; avatar?: string }) {
    return request.put<ApiResponse<User>>('/api/user/info', data)
  },

  uploadAvatar(formData: FormData) {
    return request.post<ApiResponse<UploadResult>>('/api/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
} 