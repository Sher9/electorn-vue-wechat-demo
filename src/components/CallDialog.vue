<template>
  <el-dialog
    v-model="visible"
    :title="isIncoming ? '来电' : '通话中'"
    width="400px"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <div class="call-container">
      <!-- 视频显示区域 -->
      <div v-if="isVideo" class="video-container">
        <video ref="localVideo" autoplay muted playsinline class="local-video" />
        <video ref="remoteVideo" autoplay playsinline class="remote-video" />
      </div>

      <!-- 通话信息 -->
      <div class="call-info">
        <el-avatar :size="64" :src="peerAvatar" />
        <div class="peer-name">{{ peerName }}</div>
        <div class="call-status">{{ callStatus }}</div>
      </div>

      <!-- 控制按钮 -->
      <div class="call-controls">
        <el-button v-if="isIncoming && !isConnected" type="success" circle @click="handleAccept">
          <el-icon><Phone /></el-icon>
        </el-button>

        <el-button type="danger" circle @click="handleEnd">
          <el-icon><PhoneFilled /></el-icon>
        </el-button>

        <el-button
          v-if="isConnected"
          :type="isMuted ? 'warning' : 'info'"
          circle
          @click="toggleMute"
        >
          <el-icon><Microphone /></el-icon>
        </el-button>

        <el-button
          v-if="isVideo && isConnected"
          :type="isVideoEnabled ? 'warning' : 'info'"
          circle
          @click="toggleVideo"
        >
          <el-icon><VideoCamera /></el-icon>
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>
<script setup lang="ts" name="CallDialog">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Phone, PhoneFilled, Microphone, VideoCamera } from '@element-plus/icons-vue'
import { rtcClient } from '@/utils/rtc-client'

const props = defineProps<{
  show: boolean
  isIncoming: boolean
  isVideo: boolean
  peerId: string
  peerName: string
  peerAvatar: string
  receiverId: string
  offer?: RTCSessionDescriptionInit
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'end'): void
}>()

// 状态定义
const visible = ref(props.show)
const isConnected = ref(false)
const isMuted = ref(false)
const isVideoEnabled = ref(props.isVideo)
const localVideo = ref<HTMLVideoElement>()
const remoteVideo = ref<HTMLVideoElement>()
const callStatus = ref(props.isIncoming ? '来电响铃...' : '正在呼叫...')

// 基础函数定义
const handleEnd = () => {
  rtcClient.endCall()
  visible.value = false
  emit('end')
}

const handleLocalStream = (stream: MediaStream) => {
  if (localVideo.value) {
    localVideo.value.srcObject = stream
  }
}

const handleRemoteStream = (stream: MediaStream) => {
  if (remoteVideo.value) {
    remoteVideo.value.srcObject = stream
  }
}

// 设置回调
rtcClient.onLocalStream = handleLocalStream
rtcClient.onRemoteStream = handleRemoteStream
rtcClient.onCallEnded = handleEnd

// 控制功能
const handleAccept = async () => {
  try {
    callStatus.value = '正在接通...'
    if (props.offer) {
      await rtcClient.answerCall(props.peerId, props.offer)
    }
    isConnected.value = true
    callStatus.value = '通话中'
  } catch (error) {
    console.error('Accept call error:', error)
    ElMessage.error('接听失败')
    handleEnd()
  }
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  rtcClient.toggleAudio(!isMuted.value)
}

const toggleVideo = () => {
  isVideoEnabled.value = !isVideoEnabled.value
  rtcClient.toggleVideo(isVideoEnabled.value)
}

// 生命周期钩子
onMounted(async () => {
  if (!props.isIncoming) {
    try {
      await rtcClient.startCall(props.peerId, props.receiverId, props.isVideo)
      isConnected.value = true
      callStatus.value = '通话中'
    } catch (error) {
      console.error('Start call error:', error)
      ElMessage.error('发起通话失败')
      handleEnd()
    }
  }
})

onUnmounted(() => {
  handleEnd()
})

// 监听器
watch(
  () => props.show,
  (val) => {
    visible.value = val
  }
)

watch(visible, (val) => {
  emit('update:show', val)
  if (!val) {
    handleEnd()
  }
})
</script>
<style lang="scss" scoped>
.call-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;

  .video-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;

    .remote-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
    }

    .local-video {
      position: absolute;
      right: 16px;
      bottom: 16px;
      width: 120px;
      aspect-ratio: 4/3;
      object-fit: cover;
      border-radius: 4px;
      border: 2px solid #fff;
    }
  }

  .call-info {
    text-align: center;

    .peer-name {
      margin-top: 8px;
      font-size: 18px;
      font-weight: 500;
    }

    .call-status {
      margin-top: 4px;
      color: #999;
    }
  }

  .call-controls {
    display: flex;
    gap: 16px;

    .el-button {
      font-size: 24px;
    }
  }
}
</style>