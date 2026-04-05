// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
// 导入登录页组件
import LoginPage from '@/pages/login/index.vue'

// 定义路由规则
const routes: Array<RouteRecordRaw> = [
  {
    path: '/', // 根路径
    redirect: '/login' // 重定向到登录页
  },
  {
    path: '/login', // 登录页路径
    name: 'Login',
    component: LoginPage // 挂载登录页组件
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router