<template>
  <div class="confirm-container">
    <div class="confirm-content">
      <div class="header">
        <img src="@/assets/logo.png" class="logo" alt="logo" />
        <h2>确认登录</h2>
      </div>

      <div class="device-info">
        <p>WeChat Desktop 正在请求登录</p>
        <!-- <p class="tip">请在手机上确认是否登录</p> -->
      </div>

      <!-- <div class="user-info">
        <el-avatar :size="80" :src="userStore.avatar">
          {{ userStore.username?.substring(0, 1) }}
        </el-avatar>
        <h3>{{ userStore.username }}</h3>
      </div> -->

      <div class="actions">
        <el-button type="primary" @click="handleConfirm" :loading="loading"> 确认登录 </el-button>
        <!-- <el-button @click="handleCancel">取消</el-button> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { userApi } from '@/api/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const handleConfirm = async () => {
  try {
    loading.value = true

    const code = route.query.code as string
    ElMessage.success(code)
    await userApi.confirmQRCode(code)
    ElMessage.success('已确认登录')
    router.push('/chat')
  } catch (error) {
    ElMessage.error('确认失败')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.confirm-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);

  .confirm-content {
    width: 400px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 16px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    text-align: center;

    .header {
      margin-bottom: 30px;

      .logo {
        width: 64px;
        margin-bottom: 16px;
      }

      h2 {
        font-size: 24px;
        color: #333;
        margin: 0;
      }
    }

    .device-info {
      margin-bottom: 30px;

      p {
        margin: 8px 0;
        color: #666;

        &.tip {
          font-size: 14px;
          color: #999;
        }
      }
    }

    .user-info {
      margin-bottom: 30px;

      h3 {
        margin: 12px 0 0;
        font-size: 18px;
        color: #333;
      }
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;

      .el-button {
        width: 120px;
      }
    }
  }
}
</style>