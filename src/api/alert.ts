// 首页数据接口
import request from '@/utils/request'

/**
 * 获取告警信息
 * @returns 告警详细信息
 */
// 支持分页参数
function getAlertData(params?: {
  pageNum?: number;
  pageSize?: number;
  status?: number;
  level?: number;
  target?: string;
  notice?: string;
}) {
  return request.get('/alerts', { params });
}

/**
 * 更新告警状态
 * @param alertId 告警ID
 * @param status 传入的状态
 * @returns 返回的告警状态
 */
function updateAlertStatus(alertId: number, status: number) {
  return request.put(`/alerts/${alertId}/status`, { status })
}

/**
 * 删除告警
 * @param alertId 告警ID
 * @returns 删除告警
 */
function deleteAlert(alertId: number) {
  return request.delete(`/alerts/${alertId}`)
}

export { getAlertData, updateAlertStatus, deleteAlert }