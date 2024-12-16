interface NotificationOptions {
  title: string
  message: string
  icon?: string
}

class NotificationService {
  private soundEnabled = true
  private desktopEnabled = false
  private notificationSound: HTMLAudioElement

  constructor() {
    this.notificationSound = new Audio('/notification.mp3')
    this.loadSettings()
  }

  private loadSettings() {
    const settings = localStorage.getItem('notificationSettings')
    if (settings) {
      const { sound, desktop } = JSON.parse(settings)
      this.soundEnabled = sound
      this.desktopEnabled = desktop
    }
  }

  async notify({ title, message, icon }: NotificationOptions) {
    // 播放提示音
    if (this.soundEnabled) {
      this.notificationSound.play().catch(console.error)
    }

    // 显示桌面通知
    if (this.desktopEnabled && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: message,
          icon
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (error) {
        console.error('显示通知失败:', error)
      }
    }
  }

  updateSettings(settings: { sound: boolean; desktop: boolean }) {
    this.soundEnabled = settings.sound
    this.desktopEnabled = settings.desktop
  }
}

export const notificationService = new NotificationService() 