import axios from 'axios'
import { useUserStore } from '@/stores/userStore'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 基础地址（从环境变量取）
  timeout: 5000 // 请求超时时间
})

// token 刷新相关
let isRefreshing = false
let refreshPromise: Promise<any> | null = null

// 刷新 token 的方法
const refreshAccessToken = () => {
  const userStore = useUserStore()
  const refreshToken = userStore.getRefreshToken()

  if (!refreshToken) {
    userStore.clearAuth()
    router.push('/login')
    return Promise.reject(new Error('No refresh token'))
  }

  // 使用 Promise 缓存，防止多个请求同时刷新
  if (!isRefreshing) {
    isRefreshing = true
    refreshPromise = service
      .post('/auth/refresh', { token: refreshToken })
      .then((res) => {
        const { accessToken, refreshToken: newRefreshToken } = res.data
        userStore.setToken(accessToken)
        userStore.setRefreshToken(newRefreshToken)
        isRefreshing = false
        refreshPromise = null
        return accessToken
      })
      .catch((error) => {
        isRefreshing = false
        refreshPromise = null
        userStore.clearAuth()
        router.push('/login')
        return Promise.reject(error)
      })
  }

  return refreshPromise
}

// 请求拦截器：自动添加 token
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.getToken()
    
    // 不在刷新请求中添加 token（防止循环）
    if (token && !config.url?.includes('/auth/refresh')) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：处理 401 和统一返回格式
service.interceptors.response.use(
  (response) => {
    const res = response.data
    
    if (res.code !== 200) {
      // 非200状态码统一提示
      console.error('操作失败:', res.message || '请求失败')
      return Promise.reject(res)
    } else {
      return res // 返回整个响应对象，包含 code 和 data
    }
  },
  async (error) => {
    const originalRequest = error.config

    // 如果响应码是 401 且还没有重试过，尝试刷新 token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const newAccessToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return service(originalRequest) // 重新发送原始请求
      } catch (refreshError) {
        console.error('Token 刷新失败:', refreshError)
        return Promise.reject(refreshError)
      }
    }

    // 其他错误直接返回
    console.error('响应错误：', error)
    return Promise.reject(error)
  }
)

export default service