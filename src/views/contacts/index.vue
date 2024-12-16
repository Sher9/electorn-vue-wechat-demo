<template>
  <div class="contacts-container">
    <!-- 顶部操作栏 -->
    <div class="contacts-header">
      <div class="search-bar">
        <el-input v-model="searchText" placeholder="搜索联系人" :prefix-icon="Search" clearable />
      </div>
      <el-button type="primary" @click="showAddFriend = true">
        <el-icon><Plus /></el-icon>添加好友
      </el-button>
    </div>

    <!-- 联系人列表 -->
    <div class="contacts-list">
      <!-- 索引列表 -->
      <div class="index-list">
        <div
          v-for="letter in indexList"
          :key="letter"
          class="index-item"
          :class="{ active: currentLetter === letter }"
          @click="scrollToLetter(letter)"
        >
          {{ letter }}
        </div>
      </div>

      <!-- 联系人分组 -->
      <div class="contacts-groups" ref="groupsRef">
        <div v-for="(group, letter) in groupedContacts" :key="letter" class="contact-group">
          <div class="group-title" :id="`group-${letter}`">{{ letter }}</div>
          <div
            v-for="contact in group"
            :key="contact.id"
            class="contact-item"
            @click="selectContact(contact)"
          >
            <el-avatar :size="40" :src="contact.avatar">
              {{ contact.username.substring(0, 1) }}
            </el-avatar>
            <span class="contact-name">{{ contact.username }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加好友对话框 -->
    <el-dialog v-model="showAddFriend" title="添加好友" width="400px">
      <div class="search-user">
        <el-input
          v-model="searchUsername"
          placeholder="请输入用户名搜索"
          :prefix-icon="Search"
          @keyup.enter="searchUser"
        >
          <template #append>
            <el-button @click="searchUser">搜索</el-button>
          </template>
        </el-input>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResult" class="search-result">
        <div class="user-info">
          <el-avatar :size="50" :src="searchResult.avatar" />
          <div class="info">
            <div class="username">{{ searchResult.username }}</div>
          </div>
        </div>
        <el-button type="primary" @click="addFriend" :loading="adding"> 添加 </el-button>
      </div>

      <div v-if="searchError" class="search-error">
        {{ searchError }}
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import { chatApi } from '@/api/chat'
import { pinyin } from 'pinyin-pro'
import { useUserStore } from '@/store/modules/user'

interface Contact {
  id: string
  username: string
  avatar: string
  firstLetter?: string
}

const router = useRouter()
const userStore = useUserStore()
const contacts = ref<Contact[]>([])
const searchText = ref('')
const showAddFriend = ref(false)
const searchUsername = ref('')
const searchResult = ref<any>(null)
const searchError = ref('')
const adding = ref(false)
const currentLetter = ref('')
const groupsRef = ref<HTMLElement>()

// 搜索用户
const searchUser = async () => {
  if (!searchUsername.value.trim()) {
    return ElMessage.warning('请输入用户名')
  }

  try {
    const data = await userApi.searchUser(searchUsername.value)
    if (data) {
      searchResult.value = data || null
      searchError.value = ''
    }
  } catch (error) {
    searchResult.value = null
    searchError.value = '未找到该用户'
  }
}

// 添加好友
const addFriend = async () => {
  if (!searchResult.value) return

  try {
    adding.value = true
    const data = await userApi.addFriend(searchResult.value.id)
    if (data) {
      ElMessage.success('添加成功')
      showAddFriend.value = false
      // 创建聊天并跳转
      const response = await chatApi.createChat(searchResult.value.id)
      const data = response.data.data
      router.push({
        path: '/chat',
        query: { id: data.id }
      })
    }
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    adding.value = false
  }
}

// 加载联系人
const loadContacts = async () => {
  try {
    const response = await userApi.getContacts()
    const data = response.data.data
    // 处理联系人数据，添加拼音首字母
    contacts.value = data.map((contact: any) => ({
      ...contact,
      firstLetter: getFirstLetter(contact.username)
    }))
  } catch (error) {
    ElMessage.error('获取联系人列表失败')
  }
}

// 获取中文拼音首字母
const getFirstLetter = (name: string): string => {
  return pinyin(name, { pattern: 'first', toneType: 'none' })[0].toUpperCase()
}

// 按字母分组的联系人列表
const groupedContacts = computed(() => {
  const filtered = contacts.value.filter((contact) =>
    contact.username.toLowerCase().includes(searchText.value.toLowerCase())
  )

  const groups: Record<string, Contact[]> = {}
  filtered.forEach((contact) => {
    const letter = contact.firstLetter || '#'
    if (!groups[letter]) {
      groups[letter] = []
    }
    groups[letter].push(contact)
  })

  // 对每个分组内的联系人按名字排序
  Object.keys(groups).forEach((letter) => {
    groups[letter].sort((a, b) => a.username.localeCompare(b.username))
  })

  // 返回按字母排序的分组
  return Object.keys(groups)
    .sort()
    .reduce((acc, letter) => {
      acc[letter] = groups[letter]
      return acc
    }, {} as Record<string, Contact[]>)
})

// 索引列表
const indexList = computed(() => {
  return Object.keys(groupedContacts.value).sort()
})

// 滚动到指定字母分组
const scrollToLetter = (letter: string) => {
  currentLetter.value = letter
  const element = document.getElementById(`group-${letter}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

// 选择联系人
const selectContact = async (contact: Contact) => {
  try {
    const response = await chatApi.createChat(contact.id)
    const data = response.data.data
    router.push({
      path: '/chat',
      query: { id: data.id }
    })
  } catch (error) {
    ElMessage.error('创建聊天失败')
  }
}

onMounted(() => {
  loadContacts()
})
</script>

<style lang="scss" scoped>
.contacts-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  .contacts-header {
    padding: 12px;
    background: #fff;
    border-bottom: 1px solid #eee;
    display: flex;
    gap: 12px;
    align-items: center;

    .search-bar {
      padding: 12px;
      background: #fff;
      border-bottom: 1px solid #eee;

      :deep(.el-input__wrapper) {
        border-radius: 16px;
        background: #f5f5f5;
      }
    }
  }
  .search-user {
    margin-bottom: 20px;
  }

  .search-result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .info {
        .username {
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }
      }
    }
  }

  .search-error {
    text-align: center;
    color: #f56c6c;
    padding: 20px 0;
  }

  .contacts-list {
    flex: 1;
    position: relative;
    overflow: hidden;

    .index-list {
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      padding: 10px 4px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      z-index: 1;

      .index-item {
        padding: 2px 4px;
        font-size: 12px;
        color: #fff;
        cursor: pointer;

        &.active {
          color: #409eff;
        }
      }
    }

    .contacts-groups {
      height: 100%;
      overflow-y: auto;
      padding: 0 12px;

      .contact-group {
        .group-title {
          padding: 8px 12px;
          font-size: 14px;
          color: #999;
          background: #f5f5f5;
        }

        .contact-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #fff;
          cursor: pointer;

          &:hover {
            background: #f5f5f5;
          }

          .contact-name {
            margin-left: 12px;
            font-size: 16px;
            color: #333;
          }
        }
      }
    }
  }
}
</style>