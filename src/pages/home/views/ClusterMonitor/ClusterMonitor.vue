<template>
  <div class="cluster-monitor-container">
    <!-- 页面标题 -->
    <div class="dashboard-header">
      <h1>集群监控</h1>
      <p class="subtitle">多集群统一观测 · 资源利用率 · 健康度分析</p>
    </div>

    <!-- KPI卡片 -->
    <KPICards :stats="aggregatedStats" />

    <!-- 多集群切换区域 -->
    <div class="cluster-switch-section">
      <div class="section-header">
        <h2>集群详情</h2>
        <p class="section-desc">查看单个集群深度指标，支持多集群切换</p>
      </div>
      <ClusterTabs
        :clusters="clusters"
        :selectedId="selectedClusterId"
        @select="handleClusterChange"
      />
    </div>

    <!-- 当前选中集群详细面板 -->
    <div v-if="currentCluster" class="cluster-detail">
      <div class="two-columns">
        <HealthChart :cluster="currentCluster" />
        <ResourceGauges :cluster="currentCluster" />
      </div>

      <div class="chart-card full-width">
        <div class="time-range-selector">
          <span class="range-label">时间范围：</span>
          <div class="range-buttons">
            <button
              v-for="range in timeRanges"
              :key="range.value"
              :class="['range-btn', { active: selectedRange === range.value }]"
              @click="changeTimeRange(range.value)"
            >
              {{ range.label }}
            </button>
          </div>
        </div>
        <TrendChart
          :history-data="clusterHistoryData"
          :total-memory="currentCluster.memoryTotal || 0"
          :total-slots="currentCluster.slotsMaxTotal || 0"
          :time-range="selectedRange"
        />
      </div>

      <div class="two-columns">
        <QueueChart :cluster="currentCluster" />
        <NodeLoadTop5 :nodes="topLoadNodes" />
      </div>

      <ClusterInfoCard :cluster="currentCluster" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import KPICards from './KPICards.vue'
import ClusterTabs from './ClusterTabs.vue'
import HealthChart from './HealthChart.vue'
import ResourceGauges from './ResourceGauges.vue'
import TrendChart from './TrendChart.vue'
import QueueChart from './QueueChart.vue'
import NodeLoadTop5 from './NodeLoadTop5.vue'
import ClusterInfoCard from './ClusterInfoCard.vue'
import { getClusterData, getClusterHistoryData, getClusterNodes } from '@/api/cluster'
import { getAlertData } from '@/api/alert'
import { getNodeData } from '@/api/node'
import { getQueueData } from '@/api/queue'

interface ClusterNodeStatus {
  clusterId: number
  name: string
  nodeTotal: number
  instance: string
  prometheusJob: string
  vendor: string
  description: string
  masterNode: string
  onlineNode: number
  offlineNode: number
  cpuUtilAvg: number
  memoryTotal: number
  memoryFreeTotal: number
  slotsMaxTotal: number
  slotsUsedTotal: number
}

// ---------- 响应式数据 ----------
const clusters = ref<ClusterNodeStatus[]>([])
const selectedClusterId = ref(0)
const clusterHistoryData = ref<any>(null)
const queues = ref<any[]>([])

// 时间范围选项
const timeRanges = [
  { label: '1小时', value: '1h' },
  { label: '6小时', value: '6h' },
  { label: '12小时', value: '12h' },
  { label: '1天', value: '1d' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
]
const selectedRange = ref('1h')

// 聚合统计数据
const aggregatedStats = ref({
  clusterCount: 0,
  totalNodes: 0,
  offlineNodes: 0,
  totalCpuCores: 0,
  totalGpus: 0,
  slotUsageRate: 0,
  activeAlerts: 3,
})

const topLoadNodes = ref<any[]>([])

// ---------- 计算属性 ----------
const currentCluster = computed(() => {
  const cluster = clusters.value.find(c => c.clusterId === selectedClusterId.value)
  // console.log('Current cluster:', cluster)
  return cluster ? { ...cluster, queues: queues.value } : null
})

// ---------- API 请求函数 ----------
const fetchClusterHistory = async (clusterId: number, range: string = selectedRange.value) => {
  if (!clusterId) return
  try {
    const res = await getClusterHistoryData(clusterId, { range })
    if (res.data) {
      clusterHistoryData.value = res.data
      console.log(`集群历史数据已加载 (${range})`, res.data)
    } else {
      clusterHistoryData.value = null
    }
  } catch (error) {
    console.error('获取集群历史数据失败:', error)
    clusterHistoryData.value = null
  }
}

const fetchClusterNodes = async (clusterId: number) => {
  if (!clusterId) return
  try {
    const res = await getClusterNodes(clusterId)
   
    console.log('Cluster nodes response:', res)
    if (res.data) {
      const nodes = res.data.nodes || []
      const current = clusters.value.find(c => c.clusterId === clusterId)
      if (current) {
        topLoadNodes.value = nodes.sort((a: { cpu_util_percent: number }, b: { cpu_util_percent: number }) => b.cpu_util_percent - a.cpu_util_percent).slice(0, 5)
      }
    }
  } catch (error) {
    console.error('获取集群节点数据失败:', error)
  }
}

// ---------- 事件处理 ----------
const changeTimeRange = (range: string) => {
  selectedRange.value = range
  if (selectedClusterId.value) {
    fetchClusterHistory(selectedClusterId.value, range)
  }
}

const handleClusterChange = (clusterId: number) => {
  selectedClusterId.value = clusterId
  fetchClusterHistory(clusterId, selectedRange.value)
}

// ---------- 初始化数据 ----------
const updateAggregatedStats = async () => {
  try {
    const [clusterRes, nodeRes, alertRes, queueRes] = await Promise.all([
      getClusterData(),
      getNodeData(),
      getAlertData(),
      getQueueData()
    ])

    const rawClusters = clusterRes.data
    clusters.value = rawClusters.clusters || []
    queues.value = queueRes.data?.queues || []

    // 处理集群选中及历史数据加载
    if (clusters.value.length > 0) {
      const exists = clusters.value.some(c => c.clusterId === selectedClusterId.value)
      if (!exists) {
        selectedClusterId.value = clusters.value[0]!.clusterId
        console.log('首次加载，自动选中集群ID:', selectedClusterId.value)
        await Promise.all([
          fetchClusterHistory(selectedClusterId.value, selectedRange.value),
          fetchClusterNodes(selectedClusterId.value)
        ])
      } else {
        if (!clusterHistoryData.value || clusterHistoryData.value.clusterId !== selectedClusterId.value) {
          await fetchClusterHistory(selectedClusterId.value, selectedRange.value)
        }
      }
    }

    // KPI 统计
    const clusterCount = Number(rawClusters.summary?.totalClusterCount) || 0
    const totalNodes = Number(rawClusters.summary?.totalNodeCount) || 0
    const offlineNodes = Number(rawClusters.summary?.totalOfflineNodeCount) || 0
    const totalCpuCores = Number(rawClusters.summary?.totalCpuCores) || 0
    const totalGpus = Number(rawClusters.summary?.totalGpuCount) || 0
    const totalSlots = Number(rawClusters.summary?.totalSlotsMax) || 0
    const usedSlots = Number(rawClusters.summary?.totalSlotsUsed) || 0
    const slotUsageRate = totalSlots > 0 ? Number(((usedSlots / totalSlots) * 100).toFixed(1)) : 0
    const alerts = alertRes.data?.list || []
    const activeAlerts = alerts.length

    aggregatedStats.value = {
      clusterCount,
      totalNodes,
      offlineNodes,
      totalCpuCores,
      totalGpus,
      slotUsageRate,
      activeAlerts,
    }
  } catch (error) {
    console.error('更新聚合统计数据失败:', error)
  }
}

// 生命周期
onMounted(() => {
  updateAggregatedStats()
})
</script>

<style scoped>
/* 样式保持不变，与原来相同 */
.cluster-monitor-container {
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
.dashboard-header .subtitle {
  font-size: 14px;
  color: #6e7680;
  margin: 0;
}

.cluster-switch-section {
  margin-bottom: 24px;
}
.section-header {
  margin-bottom: 16px;
}
.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 6px 0;
}
.section-header .section-desc {
  font-size: 14px;
  color: #6e7680;
  margin: 0;
}

.cluster-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.chart-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.full-width {
  grid-column: span 2;
}

.time-range-selector {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 16px;
  gap: 12px;
}
.range-label {
  font-size: 13px;
  color: #5b677b;
}
.range-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.range-btn {
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid #d0d5dd;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #1f2329;
}
.range-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}
.range-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

@media (max-width: 1200px) {
  .two-columns { grid-template-columns: 1fr; }
  .full-width { grid-column: span 1; }
}
@media (max-width: 768px) {
  .cluster-monitor-container { padding: 12px; }
}
</style>