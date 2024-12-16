<template>
  <el-popover
    v-model:visible="visible"
    trigger="click"
    :width="300"
    placement="top"
  >
    <template #reference>
      <el-button :icon="Pointer" circle />
    </template>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="表情" name="emoji">
        <div class="emoji-grid">
          <div
            v-for="emoji in emojis"
            :key="emoji"
            class="emoji-item"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="贴图" name="sticker">
        <div class="sticker-grid">
          <div
            v-for="sticker in stickers"
            :key="sticker.id"
            class="sticker-item"
            @click="selectSticker(sticker)"
          >
            <img :src="sticker.url" :alt="sticker.name">
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pointer } from '@element-plus/icons-vue'

interface Sticker {
  id: string
  name: string
  url: string
}

const visible = ref(false)
const activeTab = ref('emoji')

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'
]

// 使用本地贴图
const stickers: Sticker[] = [
  {
    id: '1',
    name: '微笑',
    url: '/stickers/sticker1.png'
  }
]

const emit = defineEmits<{
  (e: 'select', data: { type: string; content: string }): void
}>()

const selectEmoji = (emoji: string) => {
  emit('select', { type: 'emoji', content: emoji })
  visible.value = false
}

const selectSticker = (sticker: Sticker) => {
  emit('select', { type: 'sticker', content: sticker.url })
  visible.value = false
}
</script>

<script lang="ts">
export default {
  name: 'EmojiPicker'
}
</script>

<style lang="scss" scoped>
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  padding: 8px;

  .emoji-item {
    font-size: 24px;
    text-align: center;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      background: #f5f5f5;
    }
  }
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px;

  .sticker-item {
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    &:hover {
      background: #f5f5f5;
    }
  }
}
</style> 