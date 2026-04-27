//节点相关接口
import request from '@/utils/request'
/**
 * 获取节点信息
 */
function getNodeData() {
  return request.get('/nodes')
}

export { getNodeData }