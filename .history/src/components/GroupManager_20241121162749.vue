<template>
  <el-dialog
    v-model="visible"
    :title="'发起群聊'"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    destroy-on-close
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="群名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入群名称" />
      </el-form-item>
      <el-form-item label="群成员" prop="members">
        <div class="members-container">
          <div
            v-for="member in selectedMembers"
            :key="member.id"
            class="member-item"
          >
            <el-avatar :size="30" :src="member.avatar" />
            <span class="member-name">{{ member.name }}</span>
            <el-icon class="remove-icon" @click="removeMember(member)">
              <Close />
            </el-icon>
          </div>
          <div class="add-member" @click="showContactSelector = true">
            <el-icon><Plus /></el-icon>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          创建
        </el-button>
      </span>
    </template>

    <!-- 联系人选择器 -->
    <el-dialog
      v-model="showContactSelector"
      title="选择联系人"
      width="400px"
      append-to-body
    >
      <div class="contact-list">
        <div
          v-for="contact in availableContacts"
          :key="contact.id"
          class="contact-item"
          @click="selectContact(contact)"
        >
          <el-avatar :size="40" :src="contact.avatar" />
          <span class="contact-name">{{ contact.name }}</span>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Close, Plus } from '@element-plus/icons-vue'
import { chatApi } from '@/api/chat'
import { userApi } from '@/api/user'
import type { FormInstance } from 'element-plus'

interface Member {
  id: string
  name: string
  avatar: string
}

const props = defineProps<{
  show: boolean
  groupId?: string
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'created'): void
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const showContactSelector = ref(false)
const contacts = ref<Member[]>([])

const form = ref({
  name: '',
  members: [] as Member[]
})

const rules = {
  name: [
    { required: true, message: '请输入群名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  members: [
    { 
      type: 'array', 
      required: true, 
      message: '请选择群成员', 
      trigger: 'change',
      validator: (_: any, value: Member[]) => value.length >= 2
    }
  ]
}

const selectedMembers = computed(() => form.value.members)

const availableContacts = computed(() => 
  contacts.value.filter(contact => 
    !form.value.members.some(member => member.id === contact.id)
  )
)

const isEdit = computed(() => !!props.groupId)

// 获取联系人列表
const getContacts = async () => {
  try {
    const data = await userApi.getContacts()
    contacts.value = data
  } catch (error) {
    console.error('获取联系人失败:', error)
  }
}

// 选择联系人
const selectContact = (contact: Member) => {
  form.value.members.push(contact)
  showContactSelector.value = false
}

// 移除成员
const removeMember = (member: Member) => {
  const index = form.value.members.findIndex(m => m.id === member.id)
  if (index !== -1) {
    form.value.members.splice(index, 1)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    if (isEdit.value) {
      // 编辑群聊
      if (props.groupId) {
        await chatApi.addGroupMembers(
          props.groupId, 
          form.value.members.map(m => m.id)
        )
      }
    } else {
      // 创建群聊
      await chatApi.createGroup({
        name: form.value.name,
        memberIds: form.value.members.map(m => m.id)
      })
    }
    
    emit('created')
    visible.value = false
    ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
  } catch (error: any) {
    ElMessage.error(error.message || (isEdit.value ? '编辑失败' : '创建失败'))
  } finally {
    loading.value = false
  }
}

// 取消创建
const handleCancel = () => {
  form.value = {
    name: '',
    members: []
  }
  visible.value = false
}

// 监听显示状态
watch(() => props.show, (val) => {
  visible.value = val
  if (val) {
    // 打开弹框时加载联系人列表
    getContacts()
  }
})

watch(visible, (val) => {
  emit('update:show', val)
  if (!val) {
    // 关闭弹框时重置表单
    form.value = {
      name: '',
      members: []
    }
  }
})
</script>

<style lang="scss" scoped>
.members-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  
  .member-item {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    background: #f5f5f5;
    border-radius: 15px;
    
    .member-name {
      margin: 0 8px;
    }
    
    .remove-icon {
      cursor: pointer;
      color: #999;
      
      &:hover {
        color: #f56c6c;
      }
    }
  }
  
  .add-member {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #dcdfe6;
    border-radius: 50%;
    cursor: pointer;
    
    &:hover {
      border-color: #409eff;
      color: #409eff;
    }
  }
}

.contact-list {
  max-height: 400px;
  overflow-y: auto;
  
  .contact-item {
    display: flex;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    
    &:hover {
      background: #f5f5f5;
    }
    
    .contact-name {
      margin-left: 10px;
    }
  }
}
</style> 