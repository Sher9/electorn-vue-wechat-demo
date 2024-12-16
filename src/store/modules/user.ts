import { defineStore } from 'pinia'

interface UserState {
  userId: string
  username: string
  avatar: string
  token: string
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userId: '',
    username: '',
    avatar: '',
    token: ''
  }),
  actions: {
    setUserInfo(userInfo: Partial<UserState>) {
      Object.assign(this, userInfo)
    },
    clearUserInfo() {
      this.userId = ''
      this.username = ''
      this.avatar = ''
      this.token = ''
    }
  },
  persist: true
}) 