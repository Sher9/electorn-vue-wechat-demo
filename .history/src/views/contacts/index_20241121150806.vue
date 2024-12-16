<template>
  <div class="contacts-container">
    <div class="contacts-list">
      <div
        v-for="contact in contacts"
        :key="contact.id"
        class="contact-item"
      >
        <el-avatar :size="40" :src="contact.avatar" />
        <div class="contact-info">
          <div class="name">{{ contact.name }}</div>
          <div class="wxid">{{ contact.wxid }}</div>
        </div>
        <div class="status" :class="{ online: contact.online }">
          {{ contact.online ? '在线' : '离线' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userApi } from '@/api/user'

interface Contact {
  id: string
  name: string
  avatar: string
  wxid: string
  online?: boolean
}

const contacts = ref<Contact[]>([])

const loadContacts = async () => {
  try {
    const data = await userApi.getContacts()
    contacts.value = data
  } catch (error) {
    ElMessage.error('获取联系人列表失败')
  }
}

onMounted(() => {
  loadContacts()
})
</script>

<style lang="scss" scoped>
.contacts-container {
  height: 100%;
  background: #fff;

  .contacts-list {
    .contact-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      border-bottom: 1px solid #f5f5f5;
      cursor: pointer;

      &:hover {
        background: #f5f5f5;
      }

      .contact-info {
        flex: 1;
        margin-left: 12px;

        .name {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .wxid {
          font-size: 12px;
          color: #999;
        }
      }

      .status {
        font-size: 12px;
        color: #999;

        &.online {
          color: #67c23a;
        }
      }
    }
  }
}
</style> 