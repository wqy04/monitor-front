// 用户相关接口
import request from '@/utils/request'
import type { number } from 'echarts/core'

/**
 * 根据ID获取用户信息
 * @param userId 用户ID
 * @returns 用户信息
 */
function getUserInfo(userId: number) {
  return request.get(`/user/${userId}`)
}

export { getUserInfo }