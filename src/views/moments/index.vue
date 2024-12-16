<template>
  <div class="moments-container">
    <!-- 顶部封面 -->
    <div class="moments-header">
      <div class="cover-wrapper">
        <div class="cover">
          <img :src="defaultCover" alt="cover" />
          <div class="cover-mask"></div>
        </div>
        <div class="user-info">
          <div class="user-name">{{ userStore.username }}</div>
          <el-avatar :size="80" :src="userStore.avatar" />
        </div>
      </div>
    </div>

    <!-- 发布朋友圈 -->
    <div class="publish-card">
      <div class="publish-header">
        <el-avatar :size="40" :src="userStore.avatar" />
        <span class="publish-tip">发布动态</span>
      </div>
      <el-input
        v-model="newMoment.content"
        type="textarea"
        placeholder="分享新鲜事..."
        :rows="3"
        resize="none"
      />
      <div class="upload-images">
        <el-upload
          v-model:file-list="fileList"
          action=""
          list-type="picture-card"
          :http-request="uploadImage"
          :limit="9"
          :multiple="true"
        >
          <template #default>
            <div class="upload-trigger">
              <el-icon><Plus /></el-icon>
              <span>上传图片</span>
            </div>
          </template>
        </el-upload>
      </div>
      <div class="publish-actions">
        <el-button type="primary" round @click="publishMoment">发布</el-button>
      </div>
    </div>

    <!-- 朋友圈列表 -->
    <div class="moments-list">
      <div v-for="moment in moments" :key="moment.id" class="moment-card">
        <div class="moment-header">
          <el-avatar :size="46" :src="moment.avatar" />
          <div class="moment-info">
            <div class="author">{{ moment.username }}</div>
            <div class="time">{{ formatTime(moment.created_at) }}</div>
          </div>
        </div>

        <div class="moment-content">{{ moment.content }}</div>

        <!-- 图片展示 -->
        <div
          v-if="moment.images?.length"
          class="moment-images"
          :class="getImageLayoutClass(moment.images.length)"
        >
          <el-image
            v-for="(img, index) in moment.images"
            :key="index"
            :src="img"
            :preview-src-list="moment.images"
            fit="cover"
          />
        </div>

        <!-- 互动区域 -->
        <div class="moment-actions">
          <div class="action-buttons">
            <el-button text :type="isLiked(moment) ? 'primary' : ''" @click="toggleLike(moment)">
              <el-icon><Star /></el-icon>
              赞
            </el-button>
            <el-button text @click="showCommentInput(moment)">
              <el-icon><ChatSquare /></el-icon>
              评论
            </el-button>
          </div>
        </div>

        <!-- 点赞列表 -->
        <div v-if="moment.likes.length" class="likes-list">
          <el-icon><Star /></el-icon>
          <span v-for="(like, index) in moment.likes" :key="like.id">
            {{ like.username }}{{ index < moment.likes.length - 1 ? '、' : '' }}
          </span>
        </div>

        <!-- 评论列表 -->
        <div v-if="moment.comments.length" class="comments-list">
          <div
            v-for="comment in moment.comments"
            :key="comment.id"
            class="comment-item"
            @click="replyComment(moment, comment)"
          >
            <span class="comment-user">{{ comment.username }}</span>
            <template v-if="comment.replyTo">
              回复
              <span class="comment-user">{{ comment.replyTo.username }}</span> </template
            >：
            <span class="comment-content">{{ comment.content }}</span>
          </div>
        </div>

        <!-- 评论输入框 -->
        <div v-if="moment.showCommentInput" class="comment-input">
          <el-input
            v-model="moment.newComment"
            :placeholder="moment.replyTo ? `回复 ${moment.replyTo.username}` : '评论...'"
            @keyup.enter="submitComment(moment)"
          >
            <template #append>
              <el-button @click="submitComment(moment)">发送</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { momentsApi } from '@/api/moments'
import { Plus, Star, ChatSquare } from '@element-plus/icons-vue'
import type { Moment, replyMoment, Comment } from '@/types/moments'
import type { UploadRequestOptions } from 'element-plus'

const userStore = useUserStore()
const moments = ref<any>([])
const defaultCover = '/images/default-cover.jpg'
const fileList = ref<any>([])

const newMoment = ref({
  content: '',
  images: [] as string[]
})

// 获取图片布局类名
const getImageLayoutClass = (count: number) => {
  if (count === 1) return 'single'
  if (count === 2) return 'double'
  if (count === 3) return 'triple'
  return 'grid'
}

// 加载朋友圈列表
const loadMoments = async () => {
  try {
    const response = await momentsApi.getMoments()
    moments.value = response.data.data
  } catch (error) {
    ElMessage.error('获取朋友圈失败')
  }
}

// 上传图片
const uploadImage = async (options: UploadRequestOptions) => {
  try {
    const response = await momentsApi.uploadImage(options.file)
    const URL = `${import.meta.env.VITE_STATIC_URL}${response.data.data.url}`
    newMoment.value.images.push(URL)
  } catch (error) {
    ElMessage.error('图片上传失败')
  }
}

// 发布朋友圈
const publishMoment = async () => {
  if (!newMoment.value.content.trim()) {
    return ElMessage.warning('请输入内容')
  }

  try {
    await momentsApi.publishMoment({
      content: newMoment.value.content,
      images: newMoment.value.images
    })

    ElMessage.success('发布成功')
    newMoment.value = { content: '', images: [] }
    fileList.value = []
    loadMoments()
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

// 点赞/取消点赞
const toggleLike = async (moment: Moment) => {
  try {
    await momentsApi.toggleLike(moment.id)
    loadMoments()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 显示评论输入框
const showCommentInput = (moment: replyMoment) => {
  moment.showCommentInput = true
  moment.newComment = ''
  moment.replyTo = undefined
}

// 回复评论
const replyComment = (moment: replyMoment, comment: Comment) => {
  moment.showCommentInput = true
  moment.newComment = ''
  moment.replyTo = {
    id: comment.id,
    username: comment.username
  }
}

// 提交评论
const submitComment = async (moment: replyMoment) => {
  if (!moment.newComment?.trim()) return

  try {
    console.log(moment)
    await momentsApi.comment(moment.id, {
      content: moment.newComment,
      replyTo: moment.replyTo?.id || ''
    })

    moment.showCommentInput = false
    loadMoments()
  } catch (error) {
    ElMessage.error('评论失败')
  }
}

// 检查是否已点赞
const isLiked = (moment: Moment) => {
  return moment.likes.some((like) => like.userId === userStore.userId)
}

// 格式化时间
const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
}

onMounted(() => {
  loadMoments()
})
</script>

<style lang="scss" scoped>
.moments-container {
  height: 100%;
  overflow-y: auto;
  background: #f5f5f5;

  .moments-header {
    .cover-wrapper {
      position: relative;
      height: 340px;
      overflow: hidden;

      .cover {
        position: relative;
        height: 100%;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-mask {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.4));
        }
      }

      .user-info {
        position: absolute;
        right: 30px;
        bottom: 30px;
        text-align: right;
        z-index: 1;

        .user-name {
          margin-bottom: 12px;
          font-size: 20px;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .el-avatar {
          border: 4px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      }
    }
  }

  .publish-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    margin: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .publish-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      .publish-tip {
        margin-left: 12px;
        font-size: 16px;
        color: #333;
      }
    }

    .upload-images {
      margin: 16px 0;

      .upload-trigger {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #909399;

        .el-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
      }
    }

    .publish-actions {
      text-align: right;

      .el-button {
        padding: 12px 30px;
      }
    }
  }

  .moments-list {
    padding: 0 20px 20px;

    .moment-card {
      background: #fff;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

      .moment-header {
        display: flex;
        align-items: flex-start;
        margin-bottom: 16px;

        .moment-info {
          margin-left: 12px;
          flex: 1;

          .author {
            font-size: 16px;
            font-weight: 500;
            color: #333;
          }

          .time {
            font-size: 13px;
            color: #999;
            margin-top: 4px;
          }
        }
      }

      .moment-content {
        font-size: 15px;
        line-height: 1.6;
        color: #333;
        margin-bottom: 16px;
      }

      .moment-images {
        display: grid;
        gap: 6px;
        margin-bottom: 16px;

        &.single {
          grid-template-columns: repeat(1, 1fr);
          max-width: 400px;
        }

        &.double {
          grid-template-columns: repeat(2, 1fr);
        }

        &.triple {
          grid-template-columns: repeat(3, 1fr);
        }

        &.grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .el-image {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          overflow: hidden;
        }
      }

      .moment-actions {
        border-top: 1px solid #f0f0f0;
        padding-top: 12px;
        margin-top: 12px;

        .action-buttons {
          display: flex;
          gap: 20px;
          justify-content: flex-end;
          .el-button {
            font-size: 14px;

            .el-icon {
              margin-right: 4px;
            }
          }
        }
      }

      .likes-list {
        margin: 10px 0;
        color: #666;

        .el-icon {
          margin-right: 5px;
          color: #1890ff;
        }
      }
      .comments-list {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;

        .comment-item {
          margin: 5px 0;
          cursor: pointer;

          &:hover {
            background: #e6e6e6;
          }

          .comment-user {
            color: #1890ff;
            font-weight: 500;
          }
        }
      }

      .comment-input {
        margin-top: 10px;
      }
    }
  }
}
</style>