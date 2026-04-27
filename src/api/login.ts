// 登录相关接口
import request from '@/utils/request'
/**
 * 用户登录接口
 * @param username 用户名
 * @param password 密码
 * @returns 
 */
function login(username: string, password: string) {
  return request.post('/auth/login', { username, password })
}

/**
 * 用户注册接口
 * @param username 用户名
 * @param password 密码
 * @param department 学院
 * @returns 
 */
function register(username: string, password: string, department: string) {
  return request.post('/auth/register', { username, password, department })
}

/**
 * 刷新 token 接口
 * @param refreshToken 刷新令牌
 * @returns 
 */
function refreshToken(token: string) {
  return request.post('/auth/refresh', { token })
}

/**
 * 忘记密码接口
 * @param username 用户名
 * @param password 新密码
 * @returns
 */
function resetPassword(username: string, password: string) {
  return request.post('/auth/password',{username, password})
}

/**
 * 登出接口
 * @returns 
 */
function logout() {  
  // 例如：
  return request.post('/auth/logout')  
}

export { login, register, refreshToken, resetPassword, logout }