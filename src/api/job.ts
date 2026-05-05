//任务相关接口
import request from '@/utils/request'
/**
 * 获取任务信息
 */
function getJobData() {
  return request.get('/jobs')
}

export { getJobData }