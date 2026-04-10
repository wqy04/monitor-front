import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 初始化
  const accessToken = ref<string>(localStorage.getItem('accessToken') || '')
  const userInfo = ref<any>(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  const isLoggedIn = computed(() => !!accessToken.value)

  // 派生属性
  const userName = computed(() => userInfo.value?.username || '')
  const userRole = computed(() => {
    const role = userInfo.value?.userRole
    return role === '0' ? '系统管理员' : '普通用户'
  })

  // 方法
   const getToken = () => {
    return accessToken.value
  }
  const setToken = (token: string) => {
    accessToken.value = token
    localStorage.setItem('accessToken', token)
  }

  const setUserInfo = (info: any) => {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  const setRefreshToken = (token: string) => {
    localStorage.setItem('refreshToken', token)
  }

  const getRefreshToken = () => {
    return localStorage.getItem('refreshToken')
  }

  const clearAuth = () => {
    accessToken.value = ''
    userInfo.value = {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('refreshToken')
  }

  return {
    accessToken,
    userInfo,
    isLoggedIn,
    userName,
    userRole,
    getToken,
    setToken,
    setUserInfo,
    setRefreshToken,
    getRefreshToken,
    clearAuth
  }
})