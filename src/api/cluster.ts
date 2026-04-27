// 集群数据接口
import request from '@/utils/request'

/**
 * 获取集群信息
 * @returns 集群详细信息
 */
function getClusterData() {
  return request.get('/clusters')
}

/**
 * 获取集群历史数据
 * @param clusterId 集群ID
 * @param params 查询参数 { range?: string; start?: number; end?: number; step?: number }
 * @returns 集群历史数据
 */
function getClusterHistoryData(clusterId: number, params?: { range?: string; start?: number; end?: number; step?: number }) {
  return request.get(`/clusters/${clusterId}/history`, { params })
}

/**
 * 获取集群节点信息
 * @param clusterId 集群ID
 * @returns 集群节点信息
 */
function getClusterNodes(clusterId: number) {
  return request.get(`/clusters/${clusterId}/nodes`)
}


export { getClusterData, getClusterHistoryData, getClusterNodes }