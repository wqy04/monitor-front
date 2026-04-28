//队列相关接口
import request from '@/utils/request'
/**
 * 获取队列信息
 */
function getQueueData() {
  return request.get('/queues')
}

export { getQueueData }