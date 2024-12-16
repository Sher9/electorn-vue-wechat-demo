import { defineStore } from 'pinia'
import { api } from '@/api'
import type { Chat, Message, Contact } from '@/types'

interface ChatState {
  chats: Chat[]
  currentChatId: string | null
  contacts: Contact[]
  typingUsers: Set<string>
  loaded: {
    chats: boolean
    contacts: boolean
  }
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    chats: [],
    currentChatId: null,
    contacts: [],
    typingUsers: new Set(),
    loaded: {
      chats: false,
      contacts: false
    }
  }),

  getters: {
    currentChat: (state) => state.chats.find(chat => chat.id === state.currentChatId),
    unreadTotal: (state) => state.chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)
  },

  actions: {
    async loadChats() {
      if (!this.loaded.chats) {
        const response = await api.getChats()
        this.chats = response.data.data
        this.loaded.chats = true
      }
      return this.chats
    },

    async loadContacts() {
      if (!this.loaded.contacts) {
        const response = await api.getContacts()
        this.contacts = response.data.data
        this.loaded.contacts = true
      }
      return this.contacts
    },

    setCurrentChat(chatId: string) {
      this.currentChatId = chatId
      const chat = this.chats.find(c => c.id === chatId)
      if (chat && chat.unreadCount) {
        chat.unreadCount = 0
      }
    },

    addMessage(message: Message) {
      if (!message.senderId || !message.receiverId) return;

      const chat = this.chats.find(c =>
        c.participants.includes(message.senderId!) &&
        c.participants.includes(message.receiverId!)
      )


      if (chat) {
        chat.messages.push(message)
        chat.lastMessage = message.content
        chat.lastTime = new Date(message.timestamp).toLocaleTimeString()

        if (this.currentChatId !== chat.id) {
          chat.unreadCount = (chat.unreadCount || 0) + 1
        }
      }
    },

    updateContactStatus(userId: string, online: boolean) {
      const contact = this.contacts.find(c => c.id === userId)
      if (contact) {
        contact.online = online ?? false
      }
    },

    setTypingStatus(userId: string) {
      this.typingUsers.add(userId)
      setTimeout(() => {
        this.typingUsers.delete(userId)
      }, 3000)
    },

    markMessagesAsRead(chatId: string) {
      const chat = this.chats.find(c => c.id === chatId)
      if (chat) {
        chat.messages.forEach(msg => {
          if (!msg.read) {
            msg.read = true
          }
        })
      }
    }
  },

  persist: {
    paths: ['chats', 'contacts', 'loaded']
  }
}) 