// 首页数据接口
import request from '@/utils/request'

/**
 * 获取告警信息
 * @returns 告警详细信息
 */
function getAlertData() {
  return request.get('/alerts')
}


export { getAlertData}