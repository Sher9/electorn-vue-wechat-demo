<template>
  <div class="chat-container">
    <div class="chat-list">
      <div class="chat-list-header">
        <div class="header-content">
          <div class="search-bar">
            <el-input
              v-model="searchText"
              placeholder="搜索"
              :prefix-icon="Search"
              clearable
              @input="handleSearch"
            />
          </div>
          <el-button type="success" :icon="Plus" @click="showGroupManager = true">
          </el-button>
        </div>
      </div>
      <div class="chat-items">
        <div
          v-for="chat in filteredChatList"
          :key="chat.id"
          class="chat-item"
          :class="{ active: currentChat?.id === chat.id }"
          @click="selectChat(chat)"
        >
          <el-badge :value="chat.unreadCount" :hidden="!chat.unreadCount">
            <el-avatar :size="40" :src="chat.avatar">
              {{
                chat.isGroup
                  ? chat.groupName?.substring(0, 1)
                  : chat.name?.substring(0, 1)
              }}
            </el-avatar>
          </el-badge>
          <div class="chat-info">
            <div class="name-row">
              <span class="name">{{ chat.isGroup ? chat.groupName : chat.name }}</span>
              <span class="time">{{ chat.lastTime }}</span>
            </div>
            <div class="message-row">
              <span class="last-message">{{ chat.lastMessage }}</span>
              <el-tag v-if="chat.isGroup" size="small" type="info">群聊</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-content">
      <template v-if="currentChat">
        <div class="chat-header">
          <div class="chat-title">
            <span>{{
              currentChat.isGroup ? currentChat.groupName : currentChat.name
            }}</span>
            <el-button
              v-if="currentChat.isGroup"
              type="primary"
              link
              @click="showGroupInfo = true"
            >
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
          >
            <el-avatar :size="36" :src="msg.avatar" />
            <div class="message-wrapper">
              <div class="message-sender" v-if="currentChat.isGroup && !msg.isMine">
                {{ msg.senderName }}
              </div>
              <div
                class="message-content"
                :class="{
                  'image-message': msg.type === 'image',
                  'emoji-message': msg.type === 'emoji',
                }"
              >
                <template v-if="msg.type === 'image'">
                  <img
                    :src="msg.content"
                    @click="handleImageClick(msg.content)"
                    alt="图片消息"
                  />
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
          <el-input
            v-model="messageText"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            @keydown.enter.prevent="sendMessage"
          />
          <el-button type="primary" @click="sendMessage">发送</el-button>
        </div>
      </template>
      <div v-else class="no-chat">
        <el-empty description="选择一个聊天" />
      </div>
    </div>
  </div>

  <!-- 群聊管理器 -->
  <group-manager v-model:show="showGroupManager" @created="loadChatList" />

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
    @end="handleCallEnd"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { wsClient } from "@/utils/ws-client";
import { rtcClient } from "@/utils/rtc-client";
import { useUserStore } from "@/store/modules/user";
import {
  Picture,
  CirclePlus,
  Search,
  Plus,
  Phone,
  VideoCamera,
} from "@element-plus/icons-vue";
import { chatApi } from "@/api/chat";
import ImageViewer from "@/components/ImageViewer.vue";
import EmojiPicker from "@/components/EmojiPicker.vue";
import type { UploadRequestOptions } from "element-plus";
import GroupManager from "@/components/GroupManager.vue";
import CallDialog from "@/components/CallDialog.vue";
const showGroupManager = ref(false);
// 通话相关状态
const showCall = ref(false);
const isIncomingCall = ref(false);
const isVideoCall = ref(false);
const callPeerId = ref("");
const callPeerName = ref("");
const callPeerAvatar = ref("");

const userStore = useUserStore();
const messageText = ref("");
const messageList = ref<HTMLElement>();

// 添加类型定义
interface ChatMessage extends Message {
  senderName?: string;
}

interface Message {
  id: string;
  content: string;
  type?: "text" | "image" | "emoji";
  isMine: boolean;
  avatar: string;
  time: string;
}

interface Chat {
  id: string;
  name?: string;
  groupName?: string;
  avatar?: string;
  lastMessage?: string;
  lastTime?: string;
  messages: Message[];
  isGroup?: boolean;
  unreadCount?: number;
  participants: string[];
  ownerId?: string;
}

const chatList = ref<Chat[]>([]);
const currentChat = ref<Chat | null>(null);

const previewVisible = ref(false);
const previewUrl = ref("");

// 发起语音通话
const startVoiceCall = () => {
  if (!currentChat.value) return;

  showCall.value = true;
  isIncomingCall.value = false;
  isVideoCall.value = false;
  callPeerId.value = currentChat.value.id;
  callPeerName.value = currentChat.value.isGroup
    ? currentChat.value.groupName
    : currentChat.value.name;
  callPeerAvatar.value = currentChat.value.isGroup
    ? currentChat.value.groupAvatar
    : currentChat.value.avatar;
};

// 发起视频通话
const startVideoCall = () => {
  if (!currentChat.value) return;

  showCall.value = true;
  isIncomingCall.value = false;
  isVideoCall.value = true;
  callPeerId.value = currentChat.value.id;
  callPeerName.value = currentChat.value.isGroup
    ? currentChat.value.groupName
    : currentChat.value.name;
  callPeerAvatar.value = currentChat.value.isGroup
    ? currentChat.value.groupAvatar
    : currentChat.value.avatar;
};

// 处理通话结束
const handleCallEnd = () => {
  showCall.value = false;
  isIncomingCall.value = false;
  isVideoCall.value = false;
  callPeerId.value = "";
  callPeerName.value = "";
  callPeerAvatar.value = "";
};

// WebSocket 消息处理
const handleWebSocketMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data);
    console.log("收到WebSocket消息:", data);

    if (data.type === "chat") {
      const message = data.data;
      // 找到对应的聊天
      const chat = chatList.value.find(
        (c) => c.id === (message.isMine ? message.receiverId : message.senderId)
      );

      if (chat) {
        // 确保消息数组存在
        if (!chat.messages) {
          chat.messages = [];
        }

        // 添加消息到聊天记录
        chat.messages.push({
          id: message.id,
          content: message.content,
          type: message.type,
          isMine: message.isMine,
          avatar: message.isMine ? userStore.avatar : chat.avatar,
          senderName: message.isMine ? userStore.username : chat.name,
          time: message.time || new Date().toLocaleTimeString(),
        });

        // 更新最后一条消息
        chat.lastMessage = message.type === "text" ? message.content : "[图片]";
        chat.lastTime = message.time || new Date().toLocaleTimeString();

        // 如果不是当前聊天，增加未读数
        if (currentChat.value?.id !== chat.id && !message.isMine) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }

        // 如果是当前聊天，滚动到底部
        if (currentChat.value?.id === chat.id) {
          scrollToBottom();
        }

        messageText.value = "";

        console.log("更新聊天记录:", {
          chatId: chat.id,
          messages: chat.messages,
        });
      }
    } else if (data.type === "rtc") {
      handleRTCMessage(data.data);
    } else if (data.type === "call") {
      handleCallMessage(data.data);
    }
  } catch (error) {
    console.error("处理WebSocket消息失败:", error);
  }
};
// 处理通话信令
const handleCallMessage = (data: any) => {
  switch (data.type) {
    case "offer":
      showCall.value = true;
      isIncomingCall.value = true;
      isVideoCall.value = data.isVideo;
      callPeerId.value = data.senderId;
      callPeerName.value = data.senderName;
      callPeerAvatar.value = data.senderAvatar;
      callOffer.value = data.sdp;
      break;

    case "answer":
      rtcClient.handleAnswer(data.sdp);
      break;

    case "candidate":
      rtcClient.handleCandidate(data.candidate);
      break;

    case "end":
      handleCallEnd();
      break;
  }
};

// 处理 RTC 消息
const handleRTCMessage = (data: any) => {
  switch (data.type) {
    case "offer":
      rtcClient.handleOffer(data.sdp, data.senderId);
      break;
    case "answer":
      rtcClient.handleAnswer(data.sdp);
      break;
    case "candidate":
      rtcClient.handleIceCandidate(data.candidate);
      break;
  }
};

// 上传图片
const uploadImage = async (options: UploadRequestOptions) => {
  try {
    const response = await chatApi.uploadImage(options.file);
    await sendMessage("image", response.data.data.url);
  } catch (error) {
    ElMessage.error("图片上传失败");
  }
};

const handleEmojiSelect = (data: { type: string; content: string }) => {
  if (data.type === "emoji") {
    messageText.value += data.content;
  } else if (data.type === "sticker") {
    sendMessage("image", data.content);
  }
};

const showMentionSelector = ref(false);
const groupMembers = ref<Array<{ id: string; username: string; avatar: string }>>([]);

//群组成员获取
const loadGroupMembers = async () => {
  if (!currentChat.value?.isGroup) return;
  try {
    const response = await chatApi.getGroupMembers(currentChat.value.id);
    groupMembers.value = response.data.data.filter(
      (member) => member.id !== userStore.userId
    );
  } catch (error) {
    console.error("获取群成员失败:", error);
  }
};

// @成员
const mentionMember = (member: { id: string; username: string }) => {
  messageText.value += `@${member.username} `;
  showMentionSelector.value = false;
};

// @所有人
const mentionAll = () => {
  messageText.value += "@所有人 ";
  showMentionSelector.value = false;
};

// 消息处理
const handleMessage = async (chat: Chat, msg: Message): Promise<ChatMessage> => {
  return {
    ...msg,
    isMine: msg.senderId === userStore.userId,
    avatar: msg.senderId === userStore.userId ? userStore.avatar : chat.avatar!,
    senderName: msg.senderId === userStore.userId ? userStore.username : chat.name,
    time: new Date(msg.timestamp).toLocaleTimeString(),
  };
};

//发送消息
const sendMessage = async (type = "text", content = messageText.value) => {
  if (!content.trim() || !currentChat.value) return;

  try {
    const response = await chatApi.sendMessage({
      receiverId: currentChat.value.id,
      content,
      type,
    });

    const messageData = response.data.data;
    const newMessage = await handleMessage(currentChat.value, messageData);

    if (currentChat.value) {
      currentChat.value.messages.push(newMessage);
      currentChat.value.lastMessage = type === "text" ? content : "[图片]";
      currentChat.value.lastTime = newMessage.time;
    }

    if (type === "text") {
      messageText.value = "";
    }

    scrollToBottom();
  } catch (error) {
    ElMessage.error("发送消息失败");
  }
};

const scrollToBottom = () => {
  setTimeout(() => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight;
    }
  }, 0);
};

// 添加图片预览功能
const handleImageClick = (url: string) => {
  previewUrl.value = url;
  previewVisible.value = true;
};

const searchText = ref("");

// 搜索过滤
const filteredChatList = computed(() => {
  if (!searchText.value) return chatList.value;

  const keyword = searchText.value.toLowerCase();
  return chatList.value.filter((chat) => {
    const name = chat.isGroup ? chat.groupName : chat.name;
    return (
      name?.toLowerCase().includes(keyword) ||
      chat.lastMessage?.toLowerCase().includes(keyword)
    );
  });
});

// 处理搜索
const handleSearch = () => {
  // 可以在这里添加额外的搜索逻辑
};

// 加载聊天列表
const loadChatList = async () => {
  try {
    const data = await chatApi.getChatList();
    chatList.value = data.map((chat) => ({
      id: chat.id,
      name: chat.isGroup ? chat.groupName : chat.name,
      avatar: chat.isGroup ? chat.groupAvatar : chat.avatar,
      groupName: chat.groupName,
      groupAvatar: chat.groupAvatar,
      lastMessage: chat.lastMessage || "",
      lastTime: chat.lastTime || new Date().toLocaleTimeString(),
      messages: chat.messages || [],
      isGroup: chat.isGroup || false,
      unreadCount: chat.unreadCount || 0,
      participants: chat.participants || [],
      ownerId: chat.ownerId,
    }));
    console.log("聊天列表:", chatList.value);
  } catch (error) {
    console.error("获取聊天列表失败:", error);
    ElMessage.error("获取聊天列表失败");
  }
};

// 选择聊天
const selectChat = async (chat: Chat) => {
  currentChat.value = chat;
  try {
    const response = await chatApi.getMessages(chat.id);
    if (response.data?.code === 200) {
      chat.messages = response.data.data.list.map((msg) => ({
        ...msg,
        isMine: msg.senderId === userStore.userId,
        avatar: msg.senderId === userStore.userId ? userStore.avatar : chat.avatar,
        senderName: msg.senderId === userStore.userId ? userStore.username : chat.name,
        time: new Date(msg.timestamp).toLocaleTimeString(),
      }));
      messageText.value = "";
    }
  } catch (error) {
    console.error("获取聊天消息失败:", error);
    ElMessage.error("获取聊天消息失败");
  }
  scrollToBottom();
};

// 在组件挂载时加载数据
onMounted(() => {
  loadChatList();
  wsClient.connect();
  window.addEventListener("message", handleWebSocketMessage);
});

// 在组件卸载时清理
onUnmounted(() => {
  window.removeEventListener("message", handleWebSocketMessage);
});
</script>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  height: 100%;

  .chat-list {
    width: 250px;
    border-right: 1px solid #eee;
    overflow-y: auto;

    .chat-item {
      display: flex;
      padding: 12px;
      cursor: pointer;
      align-items: center;
      border-bottom: 1px solid #f5f5f5;

      &:hover {
        background: #f5f5f5;
      }

      &.active {
        background: #e6f7ff;
      }

      .chat-info {
        flex: 1;
        margin: 0 12px;
        overflow: hidden;

        .name {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .last-message {
          color: #999;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .time {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .chat-content {
    flex: 1;
    display: flex;
    flex-direction: column;

    .chat-header {
      height: 60px;
      line-height: 60px;
      padding: 0 20px;
      border-bottom: 1px solid #eee;
      font-weight: 500;
    }

    .message-list {
      flex: 1;
      padding: 20px;
      overflow-y: auto;

      .message-item {
        display: flex;
        margin-bottom: 20px;
        align-items: flex-start;

        .message-content {
          max-width: 60%;
          margin: 0 12px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        &.message-mine {
          flex-direction: row-reverse;

          .message-content {
            background: #95ec69;
          }
        }
      }
    }

    .message-input {
      padding: 20px;
      border-top: 1px solid #eee;

      .toolbar {
        display: flex;
        padding: 10px;
        border-bottom: 1px solid #eee;

        .el-button {
          margin-right: 10px;
        }
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

.message-input {
  .toolbar {
    display: flex;
    padding: 10px;
    border-bottom: 1px solid #eee;

    .el-button {
      margin-right: 10px;
    }
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

.chat-list {
  .chat-list-header {
    padding: 12px;
    border-bottom: 1px solid #e6e6e6;
    background: #fff;

    .header-content {
      display: flex;
      align-items: center;
      gap: 10px;

      .search-bar {
        flex: 1;

        :deep(.el-input__wrapper) {
          border-radius: 16px;
          background: #f5f5f5;
        }

        :deep(.el-input__inner) {
          height: 32px;
        }
      }

      .el-button {
        height: 32px;
        padding: 0 12px;
        border-radius: 16px;
      }
    }
  }
}
</style>
