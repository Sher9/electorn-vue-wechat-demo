<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h3>个人设置</h3>
        </div>
      </template>

      <el-form :model="settingsForm" label-width="100px">
        <el-form-item label="头像">
          <el-upload class="avatar-uploader" :show-file-list="false" accept="image/*">
            <el-avatar v-if="settingsForm.avatar" :size="100" :src="settingsForm.avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="昵称">
          <el-input v-model="settingsForm.username" disabled />
        </el-form-item>

        <el-form-item label="消息通知">
          <el-switch
            v-model="settingsForm.notification.enabled"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>

        <el-form-item label="声音提醒">
          <el-switch
            v-model="settingsForm.notification.sound"
            :disabled="!settingsForm.notification.enabled"
          />
        </el-form-item>

        <el-form-item label="桌面通知">
          <el-switch
            v-model="settingsForm.notification.desktop"
            :disabled="!settingsForm.notification.enabled"
            @change="requestNotificationPermission"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave">保存设置</el-button>
        </el-form-item>

        <el-divider />

        <div class="logout-section">
          <el-button type="danger" @click="handleLogout" class="logout-button">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { userApi } from '@/api/user'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessageBox } from 'element-plus'
interface SettingsForm {
  username: string
  avatar: string
  notification: {
    enabled: boolean
    sound: boolean
    desktop: boolean
  }
}
const router = useRouter()
const userStore = useUserStore()

const settingsForm = ref<SettingsForm>({
  username: userStore.username,
  avatar: userStore.avatar,
  notification: {
    enabled: true,
    sound: true,
    desktop: true
  }
})

// 头像上传
const handleAvatarUpload = async (options: UploadRequestOptions) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    const response = await userApi.uploadAvatar(formData)
    settingsForm.value.avatar = response.data.data.url
  } catch (error) {
    ElMessage.error('头像上传失败')
  }
}

// 请求通知权限
const requestNotificationPermission = async () => {
  if (!settingsForm.value.notification.desktop) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      settingsForm.value.notification.desktop = false
      ElMessage.warning('需要通知权限才能开启桌面通知')
    }
  } catch (error) {
    console.error('请求通知权限失败:', error)
    settingsForm.value.notification.desktop = false
  }
}

// 保存设置
const handleSave = async () => {
  try {
    const response = await userApi.updateUserInfo({
      username: settingsForm.value.username,
      avatar: settingsForm.value.avatar
    })

    const userData = response.data.data
    userStore.setUserInfo({
      username: userData.username,
      avatar: userData.avatar
    })

    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 加载设置
const loadSettings = () => {
  // 加载用户信息
  settingsForm.value.username = userStore.username
  settingsForm.value.avatar = userStore.avatar

  // 加载通知设置
  try {
    const savedSettings = localStorage.getItem('notificationSettings')
    if (savedSettings) {
      settingsForm.value.notification = JSON.parse(savedSettings)
    }
  } catch (error) {
    console.error('加载通知设置失败:', error)
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning'
    })

    userStore.clearUserInfo()
    router.push('/login')
    ElMessage.success('已退出登录')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('退出失败')
    }
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style lang="scss" scoped>
.settings-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;

  .settings-card {
    max-width: 600px;
    margin: 0 auto;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 18px;
        color: #333;
      }
    }
    .avatar-uploader {
      text-align: center;

      .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 100px;
        height: 100px;
        line-height: 100px;
        text-align: center;
        border: 1px dashed #d9d9d9;
        border-radius: 50%;
        cursor: pointer;

        &:hover {
          border-color: #409eff;
        }
      }
    }
  }

  .logout-section {
    display: flex;
    justify-content: center;
    padding: 20px 0;

    .logout-button {
      width: 200px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 16px;

      .el-icon {
        font-size: 18px;
      }
    }
  }
}
</style>
