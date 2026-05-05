<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="dashboard-header">
      <h1>监控中心工作台</h1>
      <p class="subtitle">实时监控 · 统一管理 · 智能运维</p>
    </div>

    <!-- KPI 指标卡片区域 -->
    <div class="kpi-card-wrapper">
      <KpiCard type="cluster" label="集群总数" :value="clusterTotal" desc="已接入异构集群" />
      <KpiCard type="node" label="节点总数 / 离线" desc="物理节点状态统计">
        <template #value>
          {{ nodeTotal }}
          <span class="offline-text">/ {{ nodeOffline }}</span>
        </template>
      </KpiCard>
      <KpiCard type="running" label="运行中作业" :value="runningJobs" desc="正在执行的作业" />
      <KpiCard type="pending" label="排队作业" :value="pendingJobs" desc="等待调度的作业" />
      <KpiCard type="alert" label="未解决告警" :value="unsolvedAlerts" desc="待处理告警信息" />
      <!-- <KpiCard type="device" label="设备在线率" :value="deviceOnlineRate" suffix="%" desc="UPS/空调等设备" /> -->
    </div>

    <!-- 集群健康状态概览区域 -->
    <div class="cluster-health-section">
      <div class="section-header">
        <h2>集群健康状态概览</h2>
        <p class="section-desc">各集群节点健康比例，帮助快速定位异常集群</p>
      </div>
      <div class="cluster-cards-grid">
        <ClusterHealthCard v-for="cluster in clusterList" :key="cluster.clusterId" :data="cluster" />
      </div>
    </div>

    <!-- 最近告警 + 节点负载 Top5 同行并列 -->
    <div class="two-columns">
      <!-- 最近未解决告警 -->
      <div class="chart-card">
        <RecentAlertsList :alerts="alertList.slice(0, 5)" :total="alertList.length" />
      </div>

      <!-- 节点负载 Top5 -->
      <div class="chart-card">
        <div class="section-header">
          <h2>节点负载 Top5</h2>
          <p class="section-desc">按 CPU 使用率排名，实时反映节点压力</p>
        </div>
        <NodeLoadTop5 :nodes="nodeList" :clusters="clusterList" />
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getClusterData } from '@/api/cluster'
import { getNodeData } from '@/api/node'
import { getAlertData } from '@/api/alert'
import { getQueueData } from '@/api/queue'
import KpiCard from './KpiCard.vue'
import ClusterHealthCard from './ClusterHealthCard.vue'
import RecentAlertsList from './RecentAlertsList.vue'
import NodeLoadTop5 from './NodeLoadTop5.vue'

// KPI 数据
const clusterTotal = ref<number>(0)
const nodeTotal = ref<number>(0)
const nodeOffline = ref<number>(0)
const runningJobs = ref<number>(0)      // 正在运行中的作业
const pendingJobs = ref<number>(0)       // 排队作业
const unsolvedAlerts = ref<number>(0)    // 未解决告警数
// const deviceOnlineRate = ref<number>(0) // 设备在线率

// 集群列表类型
interface ClusterNodeStatus {
  clusterId: string
  name: string
  nodeTotal: number
  instance:string
  prometheusJob:string
  vendor:string
  description:string
  masterNode:string
  onlineNode:number
  offlineNode: number
}

interface Alert {
  id: number
  notice: string
  target: string
  level: number
  updateTime: string
  clusterName:string
}
const clusterList = ref<ClusterNodeStatus[]>([])
const alertList = ref<Alert[]>([])
const nodeList = ref<any[]>([])

const getKpiData = async () => {
  try {
    const [clusterRes, nodeRes, alertRes, queueRes] = await Promise.all([
      getClusterData(), 
      getNodeData(), 
      getAlertData(),
      getQueueData()
    ])
    const clusters = clusterRes.data
    const nodes = nodeRes.data.nodes
    const alerts = alertRes.data.list
    const queues = queueRes.data?.queues || []
    console.log('原始集群数据:', clusters)
    console.log('告警列表:', alerts)
    console.log('节点列表:', nodes)
    console.log('队列数据:', queues)
    alertList.value = alerts
    unsolvedAlerts.value = alerts.length
    nodeList.value = nodes
    clusterList.value = clusters.clusters
    clusterTotal.value = clusters.summary.totalClusterCount || 0
    nodeTotal.value = clusters.summary.totalNodeCount || 0
    nodeOffline.value = clusters.summary.totalOfflineNodeCount || 0
    
    // 计算运行中和等待作业数
    runningJobs.value = queues.reduce((sum: number, q: any) => sum + (q.jobsRunning || 0), 0)
    pendingJobs.value = queues.reduce((sum: number, q: any) => sum + (q.jobsPending || 0), 0)
    
  } catch (error) {
    console.error('获取KPI数据失败：', error)
  }
}

onMounted(() => {
  getKpiData()
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  padding: 20px 24px;
  box-sizing: border-box;
  background-color: #f5f7fa;
}
.dashboard-header {
  margin-bottom: 24px;
}
.dashboard-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
  margin: 0 0 8px 0;
}
.subtitle {
  font-size: 14px;
  color: #6e7680;
  margin: 0;
}
.kpi-card-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
  margin-bottom: 32px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.cluster-health-section {
  margin-top: 8px;
  margin-bottom: 24px;
}
.section-container{
  margin-top: 60px;
}
.section-header {
  margin-top: 20px;
}
.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 6px 0;
}
.section-desc {
  font-size: 14px;
  color: #6e7680;
  margin: 0;
}
.cluster-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}
.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
/* 统一卡片样式 */
.chart-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.offline-text {
  color: #e54545;
  font-weight: 500;
  margin-left: 4px;
}
@media (max-width: 1200px) {
  .kpi-card-wrapper { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .kpi-card-wrapper { grid-template-columns: 1fr; }
  .cluster-cards-grid { grid-template-columns: 1fr; }
  .two-columns { grid-template-columns: 1fr; gap: 20px; }
}
</style>