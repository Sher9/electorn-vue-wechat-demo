import request from '@/utils/request'
import type { ApiResponse } from '@/types'
import type { Moment } from '@/types/moments'
export const momentsApi = {
  // 获取朋友圈列表
  getMoments() {
    return request.get<ApiResponse<Moment[]>>('/api/moments/list')
  },

  // 发布朋友圈
  publishMoment(data: { content: string; images?: string[] }) {
    return request.post<ApiResponse<Moment>>('/api/moments', data)
  },

  // 上传图片
  uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<ApiResponse<{ url: string }>>('/api/moments/upload', formData)
  },

  // 点赞/取消点赞
  toggleLike(momentId: string) {
    return request.post<ApiResponse<void>>(`/api/moments/${momentId}/like`)
  },

  // 评论
  comment(momentId: string, data: { content: string; replyTo?: string }) {
    return request.post<ApiResponse<Comment>>(`/api/moments/${momentId}/comment`, data)
  }
}