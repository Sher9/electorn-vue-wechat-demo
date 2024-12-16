import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { setupRouterGuard } from './guard'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/login/confirm',
    name: 'loginConfirm',
    component: () => import('@/views/login/confirm.vue'),
    meta: {
      title: '确认登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: () => import('@/views/layout/index.vue'),
    redirect: '/chat',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'chat',
        name: 'chat',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: '聊天',
          keepAlive: true
        }
      },
      {
        path: 'contacts',
        name: 'contacts',
        component: () => import('@/views/contacts/index.vue'),
        meta: {
          title: '联系人',
          keepAlive: true
        }
      },
      {
        path: 'moments',
        name: 'moments',
        component: () => import('@/views/moments/index.vue'),
        meta: {
          title: '朋友圈',
          keepAlive: true
        }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/settings/index.vue'),
        meta: {
          title: '设置'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

setupRouterGuard(router)

export default router 