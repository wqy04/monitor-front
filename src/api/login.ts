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

export { login }