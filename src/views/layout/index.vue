<template>
  <div class="layout-container">
    <div class="sidebar">
      <div class="avatar">
        <el-avatar :size="40" :src="userStore.avatar" @click="goToSettings" />
      </div>
      <div class="menu">
        <div
          class="menu-item"
          :class="{ active: currentRoute === '/chat' }"
          @click="switchRoute('/chat')"
        >
          <el-tooltip content="聊天" placement="right">
            <el-icon><ChatDotRound /></el-icon>
          </el-tooltip>
        </div>
        <div
          class="menu-item"
          :class="{ active: currentRoute === '/contacts' }"
          @click="switchRoute('/contacts')"
        >
          <el-tooltip content="联系人" placement="right">
            <el-icon><UserFilled /></el-icon>
          </el-tooltip>
        </div>
        <div
          class="menu-item"
          :class="{ active: currentRoute === '/moments' }"
          @click="switchRoute('/moments')"
        >
          <el-tooltip content="朋友圈" placement="right">
            <el-icon><PictureFilled /></el-icon>
          </el-tooltip>
        </div>
        <div
          class="menu-item"
          :class="{ active: currentRoute === '/settings' }"
          @click="switchRoute('/settings')"
        >
          <el-tooltip content="设置" placement="right">
            <el-icon><Setting /></el-icon>
          </el-tooltip>
        </div>
      </div>
    </div>
    <div class="main">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChatDotRound, UserFilled, PictureFilled, Setting } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { useChatStore } from '@/store/modules/chat'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const chatStore = useChatStore()

const currentRoute = computed(() => route.path)

const switchRoute = async (path: string) => {
  // 根据路由预加载数据
  try {
    if (path === '/chat') {
      await chatStore.loadChats()
    } else if (path === '/contacts') {
      await chatStore.loadContacts()
    }
    router.push(path)
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

const goToSettings = () => {
  router.push('/settings')
}
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background: #f5f5f5;

  .sidebar {
    width: 60px;
    background: #2f2f2f;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;

    .avatar {
      margin-bottom: 20px;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.1);
      }
    }

    .menu {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .menu-item {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        color: #fff;
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        &.active {
          background: #95ec69;
          color: #2f2f2f;
        }
      }
    }
  }

  .main {
    flex: 1;
    overflow: hidden;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 