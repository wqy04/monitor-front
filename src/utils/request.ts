import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 基础地址（从环境变量取）
  timeout: 5000 // 请求超时时间
})

// 请求拦截器（可选，比如添加token）
service.interceptors.request.use(
  (config) => {
    // 示例：给请求头添加token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // 处理请求错误
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器（可选，统一处理后端返回结果）
service.interceptors.response.use(
  (response) => {
    // 示例：后端返回格式{ code: 200, data: {}, msg: '' }
    const res = response.data
    if (res.code !== 200) {
      // 非200状态码统一提示
      alert(res.msg || '请求失败')
      return Promise.reject(res)
    } else {
      return res.data // 只返回data，简化业务层调用
    }
  },
  (error) => {
    // 处理响应错误（比如404、500）
    console.error('响应错误：', error)
    alert('服务器错误，请稍后重试')
    return Promise.reject(error)
  }
)

export default service