// 用户相关接口
import request from '@/utils/request'
export interface User {
  userId?: number           
  username: string
  department?: string
  userRole?: number
  status?: string
  lastLogin?: string
  createTime?: string
}
/**
 * 根据ID获取用户信息
 * @param userId 用户ID
 * @returns 用户信息
 */
function getUserInfo(userId: number) {
  return request.get(`/user/${userId}`)
}

/**
 * 更新用户信息
 * @param user 用户类型
 * @returns 更新是否成功
 */
function updateUserInfo(user: User) {
  return request.put<Record<string, never>>('/user', user)
}

/**
 * 获取Prometheus内的用户数据
 * @returns 返回Prometheus内的用户数据
 */
function prometheusUserData() {
  return request.get('/user/prometheus-data')
}
export { getUserInfo, updateUserInfo, prometheusUserData }