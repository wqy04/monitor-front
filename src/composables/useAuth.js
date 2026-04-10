import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'

/**
 * 获取 Token 信息的 Composable
 */
export function useToken() {
  const userStore = useUserStore()

  const getAccessToken = () => {
    return userStore.getToken()
  }

  const getRefreshToken = () => {
    return userStore.getRefreshToken()
  }

  return {
    getAccessToken,
    getRefreshToken
  }
}

/**
 * 获取用户信息的 Composable
 */
export function useUserInfo() {
  const userStore = useUserStore()

  const getUserInfo = () => {
    return userStore.getUserInfo()
  }

  const isLoggedIn = () => {
    return userStore.isLoggedIn
  }

  const getUsername = () => {
    return userStore.getUserInfo()?.username || ''
  }

  const getUserId = () => {
    return userStore.getUserInfo()?.userId || null
  }

  const getDepartment = () => {
    return userStore.getUserInfo()?.department || ''
  }

  const getUserRole = () => {
    return userStore.getUserInfo()?.userRole || ''
  }

  return {
    getUserInfo,
    isLoggedIn,
    getUsername,
    getUserId,
    getDepartment,
    getUserRole
  }
}

/**
 * 登出的 Composable
 */
export function useLogout() {
  const userStore = useUserStore()
  const router = useRouter()

  const logout = () => {
    userStore.clearAuth()
    router.push('/login')
  }

  return {
    logout
  }
}

/**
 * 获取授权 Headers 的 Composable
 */
export function useAuthHeaders() {
  const userStore = useUserStore()

  const getHeaders = () => {
    const token = userStore.getToken()
    return {
      Authorization: `Bearer ${token}`
    }
  }

  return {
    getHeaders
  }
}
