<template>
  <div class="moments-container">
    <div class="moments-header">
      <div class="user-cover">
        <img :src="userStore.cover || defaultCover" alt="cover" />
        <div class="user-info">
          <span class="username">{{ userStore.username }}</span>
          <el-avatar :size="64" :src="userStore.avatar" />
        </div>
      </div>
    </div>

    <div class="moments-list">
      <!-- 发布朋友圈 -->
      <div class="publish-moment">
        <el-input
          v-model="newMoment.content"
          type="textarea"
          placeholder="分享新鲜事..."
          :rows="3"
        />
        <div class="upload-images">
          <el-upload
            v-model:file-list="newMoment.images"
            action=""
            list-type="picture-card"
            :http-request="uploadImage"
            :limit="9"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </div>
        <div class="publish-actions">
          <el-button type="primary" @click="publishMoment">发布</el-button>
        </div>
      </div>

      <!-- 朋友圈列表 -->
      <div v-for="moment in moments" :key="moment.id" class="moment-item">
        <div class="moment-header">
          <el-avatar :size="40" :src="moment.avatar" />
          <div class="moment-info">
            <div class="username">{{ moment.username }}</div>
            <div class="time">{{ formatTime(moment.createdAt) }}</div>
          </div>
        </div>

        <div class="moment-content">{{ moment.content }}</div>

        <!-- 图片展示 -->
        <div v-if="moment.images?.length" class="moment-images">
          <el-image
            v-for="(img, index) in moment.images"
            :key="index"
            :src="img"
            :preview-src-list="moment.images"
            fit="cover"
          />
        </div>

        <!-- 点赞和评论 -->
        <div class="moment-actions">
          <div class="action-buttons">
            <el-button
              text
              :type="moment.likes.includes(userStore.userId) ? 'primary' : ''"
              @click="toggleLike(moment)"
            >
              <el-icon><ThumbsUp /></el-icon>
              赞
            </el-button>
            <el-button text @click="showCommentInput(moment)">
              <el-icon><ChatDotRound /></el-icon>
              评论
            </el-button>
          </div>

          <!-- 点赞列表 -->
          <div v-if="moment.likes.length" class="likes-list">
            <el-icon><ThumbsUp /></el-icon>
            {{ moment.likes.length }}人点赞
          </div>

          <!-- 评论列表 -->
          <div v-if="moment.comments.length" class="comments-list">
            <div v-for="comment in moment.comments" :key="comment.id" class="comment-item">
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
              placeholder="评论..."
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { Plus, ThumbsUp, ChatDotRound } from '@element-plus/icons-vue'
import type { Moment, Comment } from '@/types/moments'
import type { UploadRequestOptions } from 'element-plus'

const userStore = useUserStore()
const moments = ref<Moment[]>([])
const defaultCover = '/images/default-cover.jpg'

const newMoment = ref({
  content: '',
  images: []
})

// 加载朋友圈列表
const loadMoments = async () => {
  try {
    const { data } = await momentsApi.getMoments()
    moments.value = data.data
  } catch (error) {
    ElMessage.error('获取朋友圈失败')
  }
}

// 上传图片
const uploadImage = async (options: UploadRequestOptions) => {
  try {
    const { data } = await momentsApi.uploadImage(options.file)
    return data.data.url
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
const showCommentInput = (moment: Moment) => {
  moment.showCommentInput = true
  moment.newComment = ''
}

// 提交评论
const submitComment = async (moment: Moment) => {
  if (!moment.newComment?.trim()) return

  try {
    await momentsApi.comment({
      momentId: moment.id,
      content: moment.newComment
    })
    moment.showCommentInput = false
    loadMoments()
  } catch (error) {
    ElMessage.error('评论失败')
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
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
    .user-cover {
      position: relative;
      height: 200px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .user-info {
        position: absolute;
        right: 20px;
        bottom: 20px;
        text-align: right;
        color: #fff;

        .username {
          display: block;
          margin-bottom: 10px;
          font-size: 16px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
      }
    }
  }

  .moments-list {
    padding: 20px;

    .publish-moment {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;

      .upload-images {
        margin: 10px 0;
      }

      .publish-actions {
        text-align: right;
      }
    }

    .moment-item {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;

      .moment-header {
        display: flex;
        align-items: center;
        margin-bottom: 10px;

        .moment-info {
          margin-left: 10px;

          .username {
            font-weight: 500;
          }

          .time {
            font-size: 12px;
            color: #999;
          }
        }
      }

      .moment-content {
        margin: 10px 0;
      }

      .moment-images {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
        margin: 10px 0;

        .el-image {
          width: 100%;
          height: 0;
          padding-bottom: 100%;
          border-radius: 4px;
        }
      }

      .moment-actions {
        margin-top: 10px;
        border-top: 1px solid #f5f5f5;
        padding-top: 10px;

        .action-buttons {
          display: flex;
          gap: 20px;
        }

        .likes-list {
          margin: 10px 0;
          color: #666;
        }

        .comments-list {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;

          .comment-item {
            margin: 5px 0;

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
}
</style>