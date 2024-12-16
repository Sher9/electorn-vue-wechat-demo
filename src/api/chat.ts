import request from '@/utils/request'
import type { Chat, Message, Contact, ApiResponse, UploadResult } from '@/types'

export const chatApi = {

  // 创建或获取聊天
  createChat(participantId: string) {
    return request.post<ApiResponse<Chat>>('/api/chat/create', { participantId })
  },

  getChatList() {
    return request.get<ApiResponse<Chat[]>>('/api/chat/list')
  },

  getMessages(chatId: string) {
    return request.get<ApiResponse<{ list: Message[] }>>(`/api/chat/messages/${chatId}`)
  },


  // 删除消息
  deleteMessage(messageId: string) {
    return request.delete<ApiResponse<void>>(`/api/chat/message/${messageId}`)
  },

  sendMessage(data: { chatId: string; receiverId: string; content: string; type?: string }) {
    return request.post<ApiResponse<Message>>('/api/chat/message', data)
  },

  uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<ApiResponse<UploadResult>>('/api/file/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  getGroupMembers(groupId: string) {
    return request.get<ApiResponse<Contact[]>>(`/api/chat/group/${groupId}/members`)
  },

  createGroup(data: { name: string; memberIds: string[] }) {
    return request.post<ApiResponse<Chat>>('/api/chat/group', data)
  },

  addGroupMembers(groupId: string, memberIds: string[]) {
    return request.post<ApiResponse<Chat>>(`/api/chat/group/${groupId}/members`, { memberIds })
  },

  removeGroupMember(groupId: string, memberId: string) {
    return request.delete<ApiResponse<Chat>>(`/api/chat/group/${groupId}/members/${memberId}`)
  },
  // 删除聊天
  deleteChat(chatId: string) {
    return request.delete<ApiResponse<void>>(`/api/chat/${chatId}`)
  },
  // 发送通话信令
  sendCallSignal(data: {
    receiverId: string
    type: string
    sdp?: RTCSessionDescriptionInit
    candidate?: RTCIceCandidateInit
    isVideo?: boolean
  }) {
    return request.post<ApiResponse<void>>('/api/chat/call/signal', data)
  }

} 