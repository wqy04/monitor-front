//设备相关接口
import request from '@/utils/request'
/**
 * 获取应用信息
 */
function getAppData() {
  return request.get('/apps')
}

export { getAppData }