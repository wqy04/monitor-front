// 用户相关接口
import request from '@/utils/request'
import type { number } from 'echarts/core'
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
export { getUserInfo, updateUserInfo }