<template>
  <div class="chat-container">
    <div class="chat-content-container">
      <!-- 聊天列表头部 -->
      <div class="chat-list-header">
        <div class="header-content">
          <el-input
            v-model="searchText"
            placeholder="搜索聊天"
            :prefix-icon="Search"
            class="search-bar"
            clearable
          />
          <el-button type="primary" @click="showGroupManager = true">
            <el-tooltip content="创建群聊">
              <el-icon><Plus /></el-icon>
            </el-tooltip>
          </el-button>
        </div>
      </div>

      <!-- 聊天列表 -->
      <div class="chat-list">
        <div class="chat-items">
          <div
            v-for="chat in chatList"
            :key="chat.id"
            class="chat-item"
            :class="{ active: currentChat?.id === chat.id }"
            @click="selectChat(chat)"
            @contextmenu.prevent="showContextMenu($event, chat)"
          >
            <el-badge :value="chat.unreadCount" :hidden="!chat.unreadCount">
              <el-avatar :size="40" :src="chat.avatar">
                {{ (chat.isGroup ? chat.groupName : chat.name)?.substring(0, 1) }}
              </el-avatar>
            </el-badge>
            <div class="chat-info">
              <div class="name-row">
                <span class="name">{{ chat.isGroup ? chat.groupName : chat.name }}</span>
                <span class="time">{{ chat.lastTime }}</span>
              </div>
              <div class="message-row">
                <span class="last-message" :class="{ unread: chat.unreadCount }">
                  {{ chat.lastMessage || '暂无消息' }}
                </span>
                <el-tag v-if="chat.isGroup" size="small" type="info">群聊</el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-content">
      <template v-if="currentChat">
        <div class="chat-header">
          <div class="chat-title">
            <span>{{ currentChat.isGroup ? currentChat.groupName : currentChat.name }}</span>
            <el-button v-if="currentChat.isGroup" type="primary" link @click="showGroupInfo = true">
              群成员({{ groupMembers.length }})
            </el-button>
          </div>
        </div>
        <div class="message-list" ref="messageList">
          <div
            v-for="msg in currentChat.messages"
            :key="msg.id"
            class="message-item"
            :class="{ 'message-mine': msg.isMine }"
            @contextmenu.prevent="msg.isMine && showMessageMenu($event, msg)"
          >
            <el-avatar :size="36" :src="msg.avatar" />
            <div class="message-wrapper">
              <div class="message-sender" v-if="currentChat.isGroup && !msg.isMine">
                {{ msg.senderName || '' }}
              </div>
              <div
                class="message-content"
                :class="{
                  'image-message': msg.type === 'image',
                  'emoji-message': msg.type === 'emoji'
                }"
              >
                <template v-if="msg.type === 'image'">
                  <img :src="msg.content" @click="handleImageClick(msg.content)" alt="图片消息" />
                </template>
                <template v-else-if="msg.type === 'emoji'">
                  {{ msg.content }}
                </template>
                <template v-else>
                  {{ msg.content }}
                </template>
              </div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
          </div>
        </div>
        <div class="message-input">
          <div class="toolbar">
            <el-upload
              class="image-upload"
              action=""
              :http-request="uploadImage"
              :show-file-list="false"
              accept="image/*"
            >
              <el-button :icon="Picture" circle />
            </el-upload>
            <emoji-picker @select="handleEmojiSelect" />
            <el-button
              v-if="currentChat.isGroup"
              :icon="CirclePlus"
              circle
              @click="showMentionSelector = true"
            />
            <el-button :icon="Phone" circle @click="startVoiceCall" />
            <el-button :icon="VideoCamera" circle @click="startVideoCall" />
          </div>
          <!-- 消息输入 -->
          <el-input
            v-model="messageText"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            @keydown.enter.prevent="() => sendMessage()"
          />
          <el-button type="primary" @click="() => sendMessage()" class="send-button"
            >发送</el-button
          >
        </div>
      </template>
      <div v-else class="no-chat">
        <el-empty description="选择一个聊天" />
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-show="contextMenu.show"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <div class="menu-item danger" @click="deleteChat(contextMenu.chat)">
        <el-icon><Delete /></el-icon>
        删除聊天
      </div>
    </div>
  </div>

  <!-- 群聊管理器 -->
  <group-manager v-model:show="showGroupManager" @created="handleGroupCreated" />

  <!-- 群信息弹窗 -->
  <el-dialog v-model="showGroupInfo" title="群成员" width="400px">
    <div class="group-members">
      <div v-for="member in groupMembers" :key="member.id" class="member-item">
        <el-avatar :size="40" :src="member.avatar">
          {{ member.username?.substring(0, 1) }}
        </el-avatar>
        <span class="member-name">{{ member.username }}</span>
        <el-tag v-if="member.id === currentChat?.ownerId" size="small" type="success">
          群主
        </el-tag>
      </div>
    </div>
  </el-dialog>

  <!-- 图片预览 -->
  <image-viewer v-model:show="previewVisible" :url="previewUrl" />

  <!-- @成员选择器 -->
  <el-dialog v-model="showMentionSelector" title="选择提醒的人" width="300px">
    <div class="mention-list">
      <div
        v-for="member in groupMembers"
        :key="member.id"
        class="mention-item"
        @click="mentionMember(member)"
      >
        <el-avatar :size="32" :src="member.avatar">
          {{ member.username?.substring(0, 1) }}
        </el-avatar>
        <span class="member-name">{{ member.username }}</span>
      </div>
      <div class="mention-item" @click="mentionAll">
        <el-avatar :size="32">@</el-avatar>
        <span class="member-name">所有人</span>
      </div>
    </div>
  </el-dialog>

  <!-- 添加通话弹窗 -->
  <call-dialog
    v-if="showCall"
    v-model:show="showCall"
    :is-incoming="isIncomingCall"
    :is-video="isVideoCall"
    :peer-id="callPeerId"
    :peer-name="callPeerName"
    :peer-avatar="callPeerAvatar"
    :receiver-id="currentChat?.participantId"
    @end="handleCallEnd"
  />

  <div
    v-show="messageMenu.show"
    class="message-menu"
    :style="{ top: messageMenu.y + 'px', left: messageMenu.x + 'px' }"
  >
    <div class="menu-item danger" @click="deleteMessage(messageMenu.message)">
      <el-icon><Delete /></el-icon>
      删除消息
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { wsClient } from '@/utils/ws-client'
import { rtcClient } from '@/utils/rtc-client'
import { useUserStore } from '@/store/modules/user'
import {
  Picture,
  CirclePlus,
  Search,
  Plus,
  Phone,
  VideoCamera,
  Delete
} from '@element-plus/icons-vue'
import { chatApi } from '@/api/chat'
import ImageViewer from '@/components/ImageViewer.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessageBox } from 'element-plus'
import type { Message, Chat } from '@/types'
import GroupManager from '@/components/GroupManager.vue'
import CallDialog from '@/components/CallDialog.vue'
import { formatChatTime } from '@/utils/date'
const showGroupManager = ref(false)
// 通话相关状态
const showCall = ref(false)
const isIncomingCall = ref(false)
const isVideoCall = ref(false)
const callPeerId = ref('')
const callPeerName = ref('')
const callPeerAvatar = ref('')
const showGroupInfo = ref(false)
const userStore = useUserStore()
const messageText = ref('')
const messageList = ref<HTMLElement>()
const messageMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  message: null as Message | null
})

interface ContextMenu {
  show: boolean
  x: number
  y: number
  chat: Chat | null
}

const contextMenu = ref<ContextMenu>({
  show: false,
  x: 0,
  y: 0,
  chat: null
})

// 添加 RTCClient 类型
interface RTCClient {
  handleOffer: (sdp: any, senderId: string) => Promise<void>
  handleAnswer: (sdp: any) => Promise<void>
  handleCandidate: (candidate: any) => Promise<void>
}

const chatList = ref<Chat[]>([])
const currentChat = ref<Chat | null>(null)

const previewVisible = ref(false)
const previewUrl = ref('')
const route = useRoute()
// 监听路由参数变化
watch(
  () => route.query.id,
  (newId) => {
    if (newId) {
      const chat = chatList.value.find((c) => c.id === newId)
      if (chat) {
        selectChat(chat)
      } else {
        // 如果在列表中找不到，重新加载聊天列表
        loadChatList().then(() => {
          const newChat = chatList.value.find((c) => c.id === newId)
          if (newChat) {
            selectChat(newChat)
          }
        })
      }
    }
  },
  { immediate: false }
)

// 发起语音通话
const startVoiceCall = () => {
  if (!currentChat.value) return

  showCall.value = true
  isIncomingCall.value = false
  isVideoCall.value = false
  callPeerId.value = currentChat.value.id
  callPeerName.value = currentChat.value.isGroup
    ? currentChat.value.groupName ?? ''
    : currentChat.value.name ?? ''
  callPeerAvatar.value = currentChat.value.isGroup
    ? currentChat.value.groupAvatar ?? ''
    : currentChat.value.avatar ?? ''
}

// 发起视频通话
const startVideoCall = () => {
  if (!currentChat.value) return

  showCall.value = true
  isIncomingCall.value = false
  isVideoCall.value = true
  callPeerId.value = currentChat.value.id
  callPeerName.value = currentChat.value.isGroup
    ? currentChat.value.groupName ?? ''
    : currentChat.value.name ?? ''
  callPeerAvatar.value = currentChat.value.isGroup
    ? currentChat.value.groupAvatar ?? ''
    : currentChat.value.avatar ?? ''
}

// 处理通话结束
const handleCallEnd = () => {
  showCall.value = false
  isIncomingCall.value = false
  isVideoCall.value = false
  callPeerId.value = ''
  callPeerName.value = ''
  callPeerAvatar.value = ''
}

// WebSocket 消息处理
const handleWebSocketMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data)
    console.log('收到WebSocket消息:', data)

    if (data.type === 'chat') {
      const message = data.data

      // 找到对应的聊天
      let chat = chatList.value.find(
        (c) => c.participantId === message.sender_id || c.groupId === message.groupId
      )

      if (!chat && message.isGroup) {
        // 如果是群聊且本地没有chat记录，重新加载聊天列表
        loadChatList().then(() => {
          chat = chatList.value.find((c) => c.id === message.chatId)
          if (chat) {
            handleNewMessage(chat, message)
          }
        })
      } else if (chat) {
        handleNewMessage(chat, message)
      }
    } else if (data.type === 'messageDeleted') {
      handleMessageDeleted(data.data)
    } else if (data.type === 'rtc') {
      handleRTCMessage(data.data)
    } else if (data.type === 'call') {
      handleCallMessage(data.data)
    }
  } catch (error) {
    console.error('处理WebSocket消息失败:', error)
  }
}

// 处理新消息
const handleNewMessage = (chat: Chat, message: Message) => {
  // 确保消息数组存在
  if (!chat.messages) {
    chat.messages = []
  }

  // 添加消息到聊天记录
  chat.messages.push({
    id: message.id,
    content: message.content,
    type: message.type as 'text' | 'image' | 'emoji',
    isMine: message.sender_id === userStore.userId,
    sender_avatar: message.sender_avatar,
    sender_name: message.sender_name,
    time: formatChatTime(message.created_at || new Date().toLocaleTimeString())
  } as Message)
  // 格式化消息
  chat.messages = chat.messages.map(
    (msg) =>
      ({
        ...msg,
        isMine: msg.sender_id === userStore.userId,
        avatar: msg.sender_avatar,
        senderName: msg.sender_name
      } as Message)
  )
  // 更新最后一条消息
  chat.lastMessage = message.type === 'text' ? message.content : '[图片]'
  chat.lastTime = formatChatTime(message.created_at || new Date().toLocaleTimeString())

  // 如果不是当前聊天，增加未读数
  if (currentChat.value?.id !== chat.id) {
    chat.unreadCount = (chat.unreadCount || 0) + 1
  } else {
    scrollToBottom()
  }
}
// 处理消息删除
const handleMessageDeleted = (data: { messageId: string; chatId: string; senderId: string }) => {
  const chat = chatList.value.find(
    (c) => c.participantId === data.senderId || c.groupId === data.senderId
  )
  if (chat) {
    // 从消息列表中移除消息
    const index = chat.messages.findIndex((m) => m.id === data.messageId)
    if (index !== -1) {
      chat.messages.splice(index, 1)
    }

    // 如果是当前聊天，更新最后一条消息
    if (currentChat.value?.id === chat.id) {
      const lastMsg = chat.messages[chat.messages.length - 1]
      if (lastMsg) {
        chat.lastMessage = lastMsg.type === 'text' ? lastMsg.content : '[图片]'
        chat.lastTime = formatChatTime(lastMsg.created_at || new Date().toLocaleTimeString())
      } else {
        chat.lastMessage = ''
        chat.lastTime = ''
      }
    }
  }
}

// 处理通话信令
const handleCallMessage = (data: any) => {
  switch (data.type) {
    case 'offer':
      showCall.value = true
      isIncomingCall.value = true
      isVideoCall.value = data.isVideo
      callPeerId.value = data.senderId
      callPeerName.value = data.senderName
      callPeerAvatar.value = data.senderAvatar
      callOffer.value = data.sdp
      break

    case 'answer':
      rtcClient.handleAnswer(data.sdp)
      break

    case 'candidate':
      rtcClient.handleCandidate(data.candidate)
      break

    case 'end':
      handleCallEnd()
      break
  }
}

// 修改通话处理
const callOffer = ref<any>(null)
// 处理 RTC 消息
const handleRTCMessage = (data: any) => {
  switch (data.type) {
    case 'offer':
      rtcClient.handleOffer(data.sdp, data.senderId)
      break
    case 'answer':
      rtcClient.handleAnswer(data.sdp)
      break
    case 'candidate':
      rtcClient.handleCandidate(data.candidate)
      break
  }
}

// 上传图片
const uploadImage = async (options: UploadRequestOptions) => {
  try {
    const response = await chatApi.uploadImage(options.file)
    await sendMessage('image', response.data.data.url)
  } catch (error) {
    ElMessage.error('图片上传失败')
  }
}

const handleEmojiSelect = (data: { type: string; content: string }) => {
  if (data.type === 'emoji') {
    messageText.value += data.content
  } else if (data.type === 'sticker') {
    sendMessage('image', data.content)
  }
}

const showMentionSelector = ref(false)
const groupMembers = ref<Array<{ id: string; username: string; avatar: string }>>([])

//群组成员获取
const loadGroupMembers = async () => {
  if (!currentChat.value?.isGroup) return
  try {
    const response = await chatApi.getGroupMembers(currentChat.value.groupId!)
    groupMembers.value = response.data.data
  } catch (error) {
    console.error('获取群成员失败:', error)
  }
}

// @成员
const mentionMember = (member: { id: string; username: string }) => {
  messageText.value += `@${member.username} `
  showMentionSelector.value = false
}

// @所有人
const mentionAll = () => {
  messageText.value += '@所有人 '
  showMentionSelector.value = false
}

//发送消息
const sendMessage = async (type: string = 'text', content: string = messageText.value) => {
  if (!content.trim() || !currentChat.value) return
  try {
    const chatObject = chatList.value.find((c) => c.id === currentChat.value?.id)
    if (!chatObject?.participantId && !chatObject?.groupId) return
    const response = await chatApi.sendMessage({
      chatId: currentChat.value.id || '',
      receiverId: currentChat.value.isGroup ? chatObject.groupId! : chatObject.participantId!,
      content,
      type
    })

    const messageData = response.data.data
    const newMessage = {
      ...messageData,
      isMine: true,
      avatar: userStore.avatar ?? '',
      sender: {
        name: userStore.username
      },
      time: new Date().toLocaleTimeString()
    }

    if (currentChat.value) {
      currentChat.value.messages.push(newMessage)
      currentChat.value.lastMessage = type === 'text' ? content : '[图片]'
      currentChat.value.lastTime = newMessage.time
    }

    if (type === 'text') {
      messageText.value = ''
    }

    scrollToBottom()
  } catch (error) {
    ElMessage.error('发送消息失败')
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight
    }
  }, 0)
}

// 添加图片预览功能
const handleImageClick = (url: string) => {
  previewUrl.value = url
  previewVisible.value = true
}

const searchText = ref('')

// 搜索过滤
const filteredChatList = computed(() => {
  if (!searchText.value) return chatList.value

  const keyword = searchText.value.toLowerCase()
  return chatList.value.filter((chat) => {
    const name = chat.isGroup ? chat.groupName : chat.name
    return (
      name?.toLowerCase().includes(keyword) || chat.lastMessage?.toLowerCase().includes(keyword)
    )
  })
})

// 加载聊天列表
const loadChatList = async () => {
  try {
    const response = await chatApi.getChatList()
    const data = response.data.data
    chatList.value = data.map((chat: any) => ({
      id: chat.id,
      name: chat.isGroup ? chat.groupName : chat.name,
      avatar: chat.isGroup ? chat.groupAvatar : chat.avatar,
      groupId: chat.group_id || '',
      groupName: chat.group_name,
      groupAvatar: chat.group_avatar,
      lastMessage: formatLastMessage(chat.last_message || '', chat.last_message_type),
      lastTime: formatChatTime(chat.created_at || new Date().toLocaleTimeString()),
      isGroup: chat.is_group === 1,
      unreadCount: chat.unreadCount || 0,
      participantId: chat.participant_id || '',
      ownerId: chat.owner_id,
      messages: chat.messages
    }))
    console.log('聊天列表:', chatList.value)
  } catch (error) {
    console.error('获取聊天列表失败:', error)
    ElMessage.error('获取聊天列表失败')
  }
}
// 格式化最后一条消息
const formatLastMessage = (content: string, type: string) => {
  if (!content) return ''

  switch (type) {
    case 'text':
      return content
    case 'image':
      return '[图片]'
    case 'emoji':
      return '[表情]'
    case 'file':
      return '[文件]'
    case 'voice':
      return '[语音]'
    case 'video':
      return '[视频]'
    default:
      return content
  }
}
// 选择聊天
const selectChat = async (chat: Chat) => {
  currentChat.value = chat
  try {
    //如果是群聊，获取群成员
    if (chat.isGroup) {
      await loadGroupMembers()
    }
    const response = await chatApi.getMessages(chat.id)
    if (response.data?.code === 200) {
      // 清除未读数
      chat.unreadCount = 0
      chat.messages = response.data.data.list.map(
        (msg) =>
          ({
            ...msg,
            isMine: msg.sender_id === userStore.userId,
            avatar: msg.sender_id === userStore.userId ? userStore.avatar : msg.sender_avatar,
            senderName: msg.sender_id === userStore.userId ? userStore.username : msg.sender_name,
            time: new Date(msg.created_at ?? '').toLocaleTimeString()
          } as Message)
      )
      console.log('消息:', chat.messages)
      messageText.value = ''
    }
  } catch (error) {
    console.error('获取聊天消息失败:', error)
    ElMessage.error('获取聊天消息失败')
  }
  scrollToBottom()
}

// 删除聊天
const deleteChat = async (chat: Chat | null) => {
  if (!chat) return
  hideContextMenu()

  try {
    await ElMessageBox.confirm('确定要删除此聊天吗？', '提示', {
      type: 'warning'
    })

    const response = await chatApi.deleteChat(chat.id)
    if (response.data.code === 200) {
      chatList.value = chatList.value.filter((item) => item.id !== chat.id)
      if (currentChat.value?.id === chat.id) {
        currentChat.value = null
      }
      ElMessage.success('删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
// 显示右键菜单
const showContextMenu = (event: MouseEvent, chat: Chat) => {
  event.preventDefault()
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    chat
  }
}
// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenu.value.show = false
  messageMenu.show = false
}
// 点击其他地方关闭右键菜单
const handleClickOutside = () => {
  hideContextMenu()
}
// 创建群聊成功回调
const handleGroupCreated = async () => {
  await loadChatList()
  ElMessage.success('创建群聊成功')
}
// 删除消息
const deleteMessage = async (message: Message | null) => {
  if (!message) return
  messageMenu.show = false

  try {
    await ElMessageBox.confirm('确定要删除此消息吗？', '提示', {
      type: 'warning'
    })

    await chatApi.deleteMessage(message.id)

    // 从本地消息列表中移除
    if (currentChat.value) {
      const index = currentChat.value.messages.findIndex((m) => m.id === message.id)
      if (index !== -1) {
        currentChat.value.messages.splice(index, 1)
      }
    }

    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
// 显示消息菜单
const showMessageMenu = (event: MouseEvent, message: Message) => {
  messageMenu.show = true
  messageMenu.x = event.clientX - 20
  messageMenu.y = event.clientY
  messageMenu.message = message
}

// 在组件挂载时加载数据
onMounted(() => {
  loadChatList()
  wsClient.connect()
  window.addEventListener('message', handleWebSocketMessage)
  document.addEventListener('click', handleClickOutside)
})

// 在组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('message', handleWebSocketMessage)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  height: 100%;
  background: #f5f5f5;
  .chat-content-container {
    width: 300px;
    background: #fff;
    border-right: 1px solid #e6e6e6;
    .chat-list-header {
      padding: 10px;
      border-bottom: 1px solid #e6e6e6;

      .header-content {
        display: flex;
        align-items: center;
        gap: 10px;

        .search-bar {
          flex: 1;

          :deep(.el-input__wrapper) {
            background: #f5f5f5;
            height: 32px;
            font-size: 13px;
          }
        }

        .el-button {
          display: flex;
          align-items: center;
          gap: 4px;

          .el-icon {
            font-size: 16px;
          }
        }
      }
    }

    .chat-list {
      border-right: 1px solid #eee;
      overflow-y: auto;

      .chat-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: #f5f5f5;
        }

        &.active {
          background-color: #e6f3ff;
        }

        .chat-info {
          flex: 1;
          margin: 0 12px;
          overflow: hidden;
          .name-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;

            .name {
              font-size: 16px;
              font-weight: 500;
              color: #333;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .time {
              font-size: 12px;
              color: #b2b2b2;
              flex-shrink: 0;
              margin-left: 8px;
            }
          }

          .message-row {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .last-message {
              flex: 1;
              font-size: 13px;
              color: #999;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;

              &.unread {
                color: #666;
                font-weight: 500;
              }
            }

            .el-tag {
              height: 18px;
              line-height: 16px;
              font-size: 11px;
              background: #f5f5f5;
              border-color: #e6e6e6;
              color: #999;
            }
          }
        }

        .time {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }

  .chat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;
    .chat-header {
      height: 60px;
      line-height: 60px;
      padding: 0 20px;
      border-bottom: 1px solid #eee;
      font-weight: 500;
      .chat-title {
        font-size: 16px;
        color: #2c2c2c;
        font-weight: normal;

        .el-button {
          font-size: 13px;
          color: #07c160;
          padding: 0;
          margin-left: 10px;
        }
      }
    }

    .message-list {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #f5f5f5;
      .message-item {
        display: flex;
        margin-bottom: 20px;
        align-items: flex-start;
        gap: 12px;
        .el-avatar {
          flex-shrink: 0;
          border: 1px solid #eee;
        }
        .message-wrapper {
          max-width: 60%;
          .message-sender {
            font-size: 12px;
            color: #999;
            margin-bottom: 4px;
            padding-left: 4px;
          }

          .message-content {
            position: relative;
            display: inline-block;
            padding: 10px 14px;
            background: #fff;
            border-radius: 4px;
            font-size: 14px;
            color: #2c2c2c;
            line-height: 1.5;
            word-break: break-all;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

            // 添加小三角
            &::before {
              content: '';
              position: absolute;
              top: 14px;
              left: -6px;
              width: 0;
              height: 0;
              border-style: solid;
              border-width: 6px 6px 6px 0;
              border-color: transparent #fff transparent transparent;
            }
            // 图片消息
            &.image-message {
              padding: 4px;
              background: #fff;
              border-radius: 4px;

              img {
                max-width: 200px;
                max-height: 200px;
                border-radius: 2px;
                cursor: pointer;
                transition: opacity 0.2s;

                &:hover {
                  opacity: 0.9;
                }
              }
            }
            // 表情消息
            &.emoji-message {
              font-size: 24px;
              padding: 8px;
              background: transparent;
              box-shadow: none;
            }
          }

          .message-time {
            font-size: 12px;
            color: #b2b2b2;
            margin-top: 4px;
            padding-left: 4px;
          }
        }
        &.message-mine {
          flex-direction: row-reverse;
          .message-wrapper {
            .message-content {
              background: #95ec69;
              color: #2c2c2c;
              &::before {
                left: auto;
                right: -6px;
                border-width: 6px 0 6px 6px;
                border-color: transparent transparent transparent #95ec69;
              }
            }
            .message-time {
              text-align: right;
              padding-right: 4px;
            }
          }
        }
      }
    }

    .message-input {
      background: #fff;
      border-top: 1px solid #e6e6e6;
      padding: 0 20px;
      .toolbar {
        display: flex;
        border-bottom: 1px solid #eee;
        justify-items: center;
        margin: 5px 0;
        .el-button {
          margin-right: 10px;
        }
      }

      .el-input {
        margin: 10px;

        :deep(.el-textarea__inner) {
          border: none;
          background: #fff;
          font-size: 14px;
          color: #2c2c2c;
          resize: none;

          &:focus {
            box-shadow: none;
          }
        }
      }

      .el-button {
        background: #07c160;
        border-color: #07c160;
        color: #fff;

        &:hover {
          background: #06ae56;
          border-color: #06ae56;
        }
      }

      .send-button {
        margin: 10px 0 !important;
      }
    }
  }

  .no-chat {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #999;
    font-size: 14px;
  }
}

.message-content {
  &.image-message {
    padding: 5px;

    img {
      max-width: 200px;
      max-height: 200px;
      cursor: pointer;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}

.group-members {
  .member-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    .member-name {
      margin-left: 2px;
    }
  }
}

.context-menu {
  position: fixed;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  z-index: 1000;
  min-width: 120px;

  .menu-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s;
    color: #333;
    font-size: 14px;

    .el-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    &:hover {
      background: #f5f5f5;
    }

    &.danger {
      color: #f56c6c;

      &:hover {
        background: #fef0f0;
      }

      .el-icon {
        color: #f56c6c;
      }
    }
  }
}

.message-menu {
  position: fixed;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  z-index: 1000;

  .menu-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s;

    &.danger {
      color: #f56c6c;

      &:hover {
        background: #fef0f0;
      }

      .el-icon {
        margin-right: 8px;
      }
    }
  }
}
</style>
