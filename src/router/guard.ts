import { Router, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '@/store/modules/user'

export function setupRouterGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

    // 设置页面标题
    document.title = to.meta.title ? `${to.meta.title} - WeChat` : 'WeChat'

    if (requiresAuth && !userStore.token) {
      // 需要登录但未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else if (to.path === '/login' && userStore.token) {
      // 已登录但访问登录页，跳转到首页
      next('/chat')
    } else if (to.path === '/' && userStore.token) {
      // 访问根路径时重定向到聊天页面
      next('/chat')
    } else {
      next()
    }
  })
} 