// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginPage from '@/pages/login/index.vue'
import HomePage from '@/pages/home/home.vue'

// 子页面组件（请根据实际路径调整）
import Dashboard from '@/pages/home/views/Dashboard/Dashboard.vue'
import ClusterMonitor from '@/pages/home/views/ClusterMonitor/ClusterMonitor.vue'
import NodeMonitor from '@/pages/home/views/NodeMonitor.vue'
import JobMonitor from '@/pages/home/views/JobMonitor.vue'
import UserMonitor from '@/pages/home/views/UserMonitor.vue'
import AlarmMonitor from '@/pages/home/views/AlarmMonitor.vue'
import Profile from '@/pages/home/views/Profile/Profile.vue'
import AppMonitor from '@/pages/home/views/AppMonitor.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
    redirect: '/home/dashboard',   // 默认显示工作台
    children: [
      { path: 'dashboard', name: 'dashboard', component: Dashboard },
      { path: 'cluster',   name: 'cluster',   component: ClusterMonitor },
      { path: 'node',      name: 'node',      component: NodeMonitor },
      { path: 'job',       name: 'job',       component: JobMonitor },
      { path: 'user',      name: 'user',      component: UserMonitor },
      { path: 'alarm',     name: 'alarm',     component: AlarmMonitor },
      { path: 'profile',   name: 'profile',   component: Profile },
      { path: 'apps',      name: 'apps',      component: AppMonitor }
    ]
  },
  {
    path: '/',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router