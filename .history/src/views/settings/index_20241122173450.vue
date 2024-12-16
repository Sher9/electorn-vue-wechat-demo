<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h3>个人设置</h3>
        </div>
      </template>

      <el-form :model="settingsForm" label-width="100px">
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :http-request="uploadAvatar"
            :show-file-list="false"
            accept="image/*"
          >
            <el-avatar
              v-if="settingsForm.avatar"
              :size="100"
              :src="settingsForm.avatar"
            />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="昵称">
          <el-input v-model="settingsForm.nickname" />
        </el-form-item>

        <el-form-item label="消息通知">
          <el-switch
            v-model="settingsForm.notification.enabled"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>

        <el-form-item label="声音提醒">
          <el-switch
            v-model="settingsForm.notification.sound"
            :disabled="!settingsForm.notification.enabled"
          />
        </el-form-item>

        <el-form-item label="桌面通知">
          <el-switch
            v-model="settingsForm.notification.desktop"
            :disabled="!settingsForm.notification.enabled"
            @change="requestNotificationPermission"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { useUserStore } from "@/store/modules/user";
import { userApi } from "@/api/user";
import type { UploadRequestOptions } from "element-plus";

interface SettingsForm {
  nickname: string;
  avatar: string;
  notification: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

const userStore = useUserStore();

const settingsForm = ref<SettingsForm>({
  nickname: userStore.username,
  avatar: userStore.avatar,
  notification: {
    enabled: true,
    sound: true,
    desktop: true,
  },
});

// 上传头像
// 修改头像上传
const handleAvatarUpload = async (options: UploadRequestOptions) => {
  try {
    const formData = new FormData();
    formData.append("file", options.file);
    const response = await userApi.uploadAvatar(formData);
    settingsForm.value.avatar = response.data.data.url;
  } catch (error) {
    ElMessage.error("头像上传失败");
  }
};

// 请求通知权限
const requestNotificationPermission = async () => {
  if (!settingsForm.value.notification.desktop) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      settingsForm.value.notification.desktop = false;
      ElMessage.warning("需要通知权限才能开启桌面通知");
    }
  } catch (error) {
    console.error("请求通知权限失败:", error);
    settingsForm.value.notification.desktop = false;
  }
};

// 保存设置
const handleSave = async () => {
  try {
    const response = await userApi.updateUserInfo({
      username: settingsForm.value.nickname,
      avatar: settingsForm.value.avatar,
    });

    const userData = response.data.data;
    userStore.setUserInfo({
      username: userData.username,
      avatar: userData.avatar,
    });

    ElMessage.success("设置保存成功");
  } catch (error) {
    ElMessage.error("保存失败");
  }
};

// 加载设置
const loadSettings = () => {
  // 加载用户信息
  settingsForm.value.username = userStore.username;
  settingsForm.value.avatar = userStore.avatar;

  // 加载通知设置
  try {
    const savedSettings = localStorage.getItem("notificationSettings");
    if (savedSettings) {
      settingsForm.value.notification = JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error("加载通知设置失败:", error);
  }
};

onMounted(() => {
  loadSettings();
});
</script>

<style lang="scss" scoped>
.settings-container {
  padding: 20px;

  .settings-card {
    max-width: 600px;
    margin: 0 auto;

    .avatar-uploader {
      text-align: center;

      .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 100px;
        height: 100px;
        line-height: 100px;
        text-align: center;
        border: 1px dashed #d9d9d9;
        border-radius: 50%;
        cursor: pointer;

        &:hover {
          border-color: #409eff;
        }
      }
    }
  }
}
</style>
