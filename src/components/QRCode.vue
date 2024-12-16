<template>
  <div class="qrcode-container">
    <div class="qrcode-wrapper" ref="qrcodeRef"></div>
    <div v-if="expired" class="qrcode-expired">
      <div class="expired-mask">
        <p>二维码已过期</p>
        <el-button type="primary" @click="refreshQRCode">刷新</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'QRCode'
}
</script>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { userApi } from '@/api/user'
import QRCode from 'qrcode'
import { useRouter } from 'vue-router'
import { wsClient } from '@/utils/ws-client'

const emit = defineEmits<{
  (e: 'scan', data: any): void
  (e: 'expired'): void
}>()
const router = useRouter()
const qrcodeRef = ref<HTMLElement>()
const qrcodeValue = ref('')
const expired = ref(false)
const status = ref<'pending' | 'scanned' | 'confirmed' | 'expired'>('pending')
let checkTimer: number

// 生成二维码
const generateQRCode = async () => {
  try {
    // 先获取二维码ID
    const response = await userApi.getLoginQRCode()
    qrcodeValue.value = response.data.data.code
    // 生成确认二维码的URL
    const confirmUrl = `${import.meta.env.VITE_QR_CONFIRM_URL}?code=${
      qrcodeValue.value
    }&serverUrl=${encodeURIComponent(import.meta.env.VITE_BASE_SERVER_URL)}`

    const url = await QRCode.toDataURL(confirmUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    if (qrcodeRef.value) {
      const img = new Image()
      img.src = url
      qrcodeRef.value.innerHTML = ''
      qrcodeRef.value.appendChild(img)

      expired.value = false
      status.value = 'pending'
      startCheck()
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
  }
}

// 开始检查二维码状态
const startCheck = () => {
  checkTimer = window.setInterval(async () => {
    try {
      const response = await userApi.checkQRCode(qrcodeValue.value)
      const { status, userId } = response.data.data
      if (status === 'scanned') {
        // 已扫码,等待确认
      } else if (status === 'confirmed') {
        // 已确认,可以登录
        clearInterval(checkTimer)
        emit('scan', { code: qrcodeValue.value, userId })
      } else if (status === 'expired') {
        // 已过期
        clearInterval(checkTimer)
        expired.value = true
        emit('expired')
      }
    } catch (error) {
      clearInterval(checkTimer)
      console.error('检查二维码状态失败:', error)
    }
  }, 2000)
}

const handleScan = async (data: any) => {
  if (data.status === 'scanned') {
    // 跳转到确认页面
    router.push({
      path: '/login/confirm',
      query: { code: qrcodeValue.value }
    })
  }
}
// 刷新二维码
const refreshQRCode = () => {
  generateQRCode()
}

onMounted(() => {
  generateQRCode()
})
onUnmounted(() => {
  clearInterval(checkTimer)
})
</script>

<style lang="scss" scoped>
.qrcode-container {
  position: relative;
  display: inline-block;

  .qrcode-wrapper {
    img {
      display: block;
    }
  }

  .qrcode-expired {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;

    .expired-mask {
      text-align: center;

      p {
        color: #666;
        margin-bottom: 12px;
      }
    }
  }
}
</style>