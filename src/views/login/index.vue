<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-header">
        <img src="@/assets/logo.png" class="logo" alt="logo" />
        <h1>WeChat Desktop</h1>
        <p class="subtitle">随时随地，保持联系</p>
      </div>

      <el-tabs v-model="loginType" class="login-tabs">
        <el-tab-pane label="账号登录" name="account">
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="login-form">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="用户名"
                :prefix-icon="User"
                size="large"
              >
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                class="login-button"
                :loading="loading"
                size="large"
                @click="handleLogin"
              >
                登 录
              </el-button>
            </el-form-item>

            <div class="demo-account">
              <p>演示账号：</p>
              <div class="account-list">
                <div class="account-item" @click="useDemo('张三')">
                  <el-avatar :size="40" src="avatar1.jpg">张</el-avatar>
                  <span>张三</span>
                </div>
                <div class="account-item" @click="useDemo('李四')">
                  <el-avatar :size="40" src="avatar2.jpg">李</el-avatar>
                  <span>李四</span>
                </div>
              </div>
            </div>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="扫码登录" name="qrcode">
          <div class="qrcode-login">
            <QRCode :size="200" @scan="handleScan" v-if="loginType === 'qrcode'" />
            <p class="qrcode-tip">请使用手机微信扫码登录</p>
          </div>
        </el-tab-pane>
      </el-tabs>
      <div class="login-footer">
        <p>© 2024 WeChat Desktop. All rights reserved.</p>
      </div>
    </div>

    <div class="login-bg">
      <div class="circles">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue'
import QRCode from '@/components/QRCode.vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { userApi } from '@/api/user'
import { User } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const loginType = ref('account')

const loginForm = reactive({
  username: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, message: '用户名至少2个字符', trigger: 'blur' }
  ]
}

// 处理扫码结果
const handleScan = async (data: any) => {
  try {
    const response = await userApi.qrcodeLogin(data.code)
    const userData = response.data.data

    userStore.setUserInfo({
      userId: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      token: userData.token
    })

    router.push('/')
    ElMessage.success('登录成功')
  } catch (error) {
    console.error('扫码登录失败:', error)
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()

    loading.value = true
    const response = await userApi.login({ username: loginForm.username })
    const data = response.data.data

    userStore.setUserInfo({
      userId: data.id,
      username: data.username,
      avatar: data.avatar,
      token: data.token
    })

    router.push('/')
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);

  .login-content {
    position: relative;
    z-index: 1;
    width: 420px;
    margin: auto;
    padding: 40px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 16px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    .login-header {
      text-align: center;
      margin-bottom: 40px;

      .logo {
        width: 80px;
        margin-bottom: 16px;
      }

      h1 {
        font-size: 28px;
        color: #333;
        margin: 0 0 8px;
      }

      .subtitle {
        font-size: 16px;
        color: #666;
        margin: 0;
      }
    }

    .login-form {
      .el-input {
        --el-input-hover-border: #1890ff;
        --el-input-focus-border: #1890ff;
      }

      .login-button {
        width: 100%;
        height: 44px;
        font-size: 16px;
        background: linear-gradient(90deg, #1890ff 0%, #36cfc9 100%);
        border: none;

        &:hover {
          opacity: 0.9;
        }
      }
    }
    .qrcode-login {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;

      .qrcode-tip {
        margin-top: 16px;
        color: #666;
        font-size: 14px;
      }
    }
    .demo-account {
      margin-top: 24px;
      text-align: center;

      p {
        color: #666;
        margin-bottom: 12px;
      }

      .account-list {
        display: flex;
        justify-content: center;
        gap: 24px;

        .account-item {
          cursor: pointer;
          transition: transform 0.2s;

          &:hover {
            transform: translateY(-2px);
          }

          span {
            display: block;
            margin-top: 8px;
            color: #333;
            line-height: 40px;
          }
        }
      }
    }

    .login-footer {
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
  }

  .login-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    .circles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;

      div {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        animation: animate 25s linear infinite;

        &:nth-child(1) {
          left: 25%;
          width: 80px;
          height: 80px;
          animation-delay: 0s;
        }

        &:nth-child(2) {
          left: 10%;
          width: 20px;
          height: 20px;
          animation-delay: 2s;
          animation-duration: 12s;
        }

        &:nth-child(3) {
          left: 70%;
          width: 20px;
          height: 20px;
          animation-delay: 4s;
        }
      }
    }
  }
}

@keyframes animate {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-1000px) rotate(720deg);
    opacity: 0;
  }
}
</style> 