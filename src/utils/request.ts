import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const request = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 5000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const { code, message } = response.data

    if (code === 200) {
      return response
    }

    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  error => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.clearUserInfo()
      window.location.href = '/login'
    }
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

export default request 