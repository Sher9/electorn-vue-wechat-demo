<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="80%"
    :before-close="handleClose"
    class="image-viewer"
  >
    <div class="image-container">
      <img :src="imageUrl" :alt="title" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  show: boolean
  url: string
  title?: string
}>()

const emit = defineEmits(['update:show'])

const visible = ref(props.show)
const imageUrl = ref(props.url)

watch(() => props.show, (val) => {
  visible.value = val
})

watch(() => props.url, (val) => {
  imageUrl.value = val
})

watch(visible, (val) => {
  emit('update:show', val)
})

const handleClose = () => {
  visible.value = false
}
</script>

<script lang="ts">
export default {
  name: 'ImageViewer'
}
</script>

<style lang="scss" scoped>
.image-viewer {
  .image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    
    img {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
    }
  }
}
</style> 