<template>
  <div class="node-monitor-container">
    <!-- 页面标题区 -->
    <div class="monitor-header">
      <div class="header-top">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
          返回集群监控
        </button>
      </div>
      <h1>{{ pageTitle }}</h1>
      <p class="subtitle">实时查看集群节点的资源状态、负载与健康信息</p>
    </div>

    <!-- 筛选栏卡片 - 使用 Naive UI 组件 -->
    <div class="filter-card">
      <div class="filter-row">
        <div class="filter-group">
          <label>节点状态</label>
          <n-select
            v-model:value="filters.status"
            :options="statusOptions"
            placeholder="全部状态"
            clearable
            size="small"
            style="width: 140px"
          />
        </div>
        <div class="filter-group">
          <label>节点类型</label>
          <n-select
            v-model:value="filters.nodeType"
            :options="nodeTypeOptions"
            placeholder="全部类型"
            clearable
            size="small"
            style="width: 150px"
          />
        </div>
        <div class="filter-stats">
          <span class="stats-badge">总节点 {{ totalNodes }}</span>
          <span class="stats-badge">当前筛选 {{ filteredNodes.length }}</span>
          <n-button size="small" text type="primary" @click="resetFilters">重置筛选</n-button>
        </div>
      </div>
    </div>

    <!-- 节点卡片网格 -->
    <div v-if="loading" class="loading-state">
      <n-spin size="large" />
      <p>加载节点数据中...</p>
    </div>
    <div v-else-if="filteredNodes.length === 0" class="empty-state">
      <p>没有找到符合条件的节点</p>
    </div>
    <div v-else class="node-grid">
      <div
        v-for="node in filteredNodes"
        :key="node.nodeId"
        class="node-card"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="node-title">
            <h3>{{ node.nodeName }}</h3>
            <span class="node-id">ID: {{ node.nodeId }}</span>
          </div>
          <div class="node-badges">
            <span class="status-badge" :class="getStatusClass(node.status)">
              {{ node.status === 'ok' ? '正常' : (node.status === 'unavail' ? '不可用' : '关闭') }}
            </span>
            <span class="type-badge" :class="getTypeClass(derivedNodeType(node))">
              {{ derivedNodeType(node) }}
            </span>
          </div>
        </div>

        <!-- 关键资源区域 -->
        <div class="resource-summary">
          <div class="resource-item">
            <span class="resource-label">CPU</span>
            <span class="resource-value">{{ formatCpu(node) }}</span>
            <span class="resource-sub">利用率 {{ node.cpu_util_percent ?? 0 }}%</span>
          </div>
          <div class="resource-item">
            <span class="resource-label">内存</span>
            <span class="resource-value">{{ formatMemory(node.memoryTotal) }}</span>
            <span class="resource-sub">可用 {{ formatMemorySize(node.mem_free_bytes) }}</span>
          </div>
          <div class="resource-item">
            <span class="resource-label">负载</span>
            <span class="resource-value">{{ node.load_1m?.toFixed(1) ?? 0 }}</span>
            <span class="resource-sub">15m: {{ node.load_r15m?.toFixed(1) ?? 0 }}</span>
          </div>
        </div>

        <!-- GPU 特殊展示 -->
        <div v-if="node.gpuCount > 0 && node.gpuMetrics" class="gpu-section">
          <div class="section-title">GPU 状态</div>
          <div class="gpu-list">
            <div
              v-for="gpu in node.gpuMetrics"
              :key="gpu.gpuIndex"
              class="gpu-item"
            >
              <span class="gpu-index">GPU{{ gpu.gpuIndex }}</span>
              <span class="gpu-util">利用率 {{ gpu.util_percent ?? 0 }}%</span>
              <span class="gpu-temp">{{ gpu.temperature_celsius ?? 0 }}°C</span>
              <span class="gpu-mem">显存空余 {{ formatMemorySize(gpu.mem_free_bytes) }}</span>
            </div>
          </div>
          <div class="gpu-model" v-if="node.gpuModel">
            型号: {{ node.gpuModel }} | 数量: {{ node.gpuCount }}
          </div>
        </div>

        <!-- 完整信息区域（队列信息完整展示） -->
        <div class="full-details">
          <div class="section-title">详细信息</div>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">集群ID</span>
              <span class="detail-value">{{ node.clusterId ?? '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">分区</span>
              <span class="detail-value">{{ node.partition || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">节点IP</span>
              <span class="detail-value">{{ node.nodeIp || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">cpu总核数</span>
              <span class="detail-value">{{ node.cpuTotal ?? '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">已用槽位</span>
              <span class="detail-value">{{ node.slots_used ?? 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">空闲时长</span>
              <span class="detail-value">{{ node.idle_minutes ?? 0 }} 分钟</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">磁盘IO (KB)</span>
              <span class="detail-value">{{ node.io_kb ?? 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">登录会话数</span>
              <span class="detail-value">{{ node.login_sessions ?? 0 }}</span>
            </div>
            <!-- 队列信息 - 完整展示 -->
            <div class="detail-item full-width queues-item">
              <span class="detail-label">队列列表</span>
              <div class="queues-list-full">
                <span v-for="(queue, idx) in getQueuesArray(node.queues)" :key="idx" class="queue-tag">
                  {{ queue }}
                </span>
                <span v-if="getQueuesArray(node.queues).length === 0" style="color: #8b92a0;">无</span>
              </div>
            </div>
            <div class="detail-item">
              <span class="detail-label">swap空闲</span>
              <span class="detail-value">{{ formatMemorySize(node.swap_free_bytes) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">tmp空闲</span>
              <span class="detail-value">{{ formatMemorySize(node.tmp_free_bytes) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">pg_rate</span>
              <span class="detail-value">{{ node.pg_rate ?? 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">功耗支持</span>
              <span class="detail-value">{{ node.powerSupported ? '支持' : '不支持' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NSelect, NButton, NSpin } from 'naive-ui'
import { getQueueData } from '@/api/queue'
import { getNodeData } from '@/api/node'
import { getClusterData } from '@/api/cluster' // 请根据实际路径调整

// 集群数据类型定义
interface ClusterInfo {
  clusterId: number
  clusterName: string
  [key: string]: any
}

// GPU指标接口
interface GpuMetric {
  gpuIndex: number
  util_percent: number
  temperature_celsius: number
  mem_free_bytes: number
  mem_util_percent: number
  power_usage_watts: number
}

// 节点数据接口
interface NodeItem {
  nodeId: number
  nodeName: string
  clusterId: number
  status: string   // 'ok' | 'unavail'
  nodeType: string // 原始类型
  partition: string
  nodeIp: string
  cpuTotal: number | null
  cpu_util_percent: number
  memoryTotal: number | null   // MB单位
  mem_free_bytes: number
  load_1m: number
  load_r15m: number
  load_r15s: number
  slots_used: number
  idle_minutes: number
  io_kb: number
  login_sessions: number
  swap_free_bytes: number
  tmp_free_bytes: number
  pg_rate: number
  powerSupported: number
  gpuCount: number
  gpuModel: string | null
  gpuMetrics?: GpuMetric[]
  queues: string[] | string | null  // 兼容不同类型
  diskTotal: number | null
}

// 响应式数据
const nodeList = ref<NodeItem[]>([])
const queueList = ref<any[]>([])
const clusters = ref<ClusterInfo[]>([])   // 存储集群列表
const loading = ref(true)

// Router
const route = useRoute()
const router = useRouter()

// ---------- 计算属性 ----------
// 动态标题
const pageTitle = computed(() => {
  const clusterName = route.query.clusterName as string
  return clusterName ? `${clusterName} 集群节点监控` : '节点监控'
})

// 筛选条件
const filters = reactive({
  clusterId: null as number | null,
  status: null as string | null,
  nodeType: null as string | null,
})

// 筛选选项配置
const statusOptions = [
  { label: '正常', value: 'ok' },
  { label: '不可用', value: 'unavail' },
  { label: '关闭', value: 'closed' }
]

const nodeTypeOptions = [
  { label: '普通节点', value: '普通节点' },
  { label: '大内存节点', value: '大内存节点' },
  { label: 'GPU节点', value: 'GPU节点' },
  { label: 'CPU计算节点', value: 'CPU计算节点' }
]

// 集群选项 - 从 getClusterData() 获取的数据生成
const clusterOptions = computed(() => {
  return clusters.value.map(cluster => ({
    label: cluster.clusterName,
    value: cluster.clusterId
  }))
})

// 总节点数
const totalNodes = computed(() => nodeList.value.length)

// 筛选后的节点列表
const filteredNodes = computed(() => {
  return nodeList.value.filter(node => {
    // 集群筛选
    if (filters.clusterId !== null && node.clusterId !== filters.clusterId) return false
    // 状态筛选
    if (filters.status !== null && node.status !== filters.status) return false
    // 节点类型筛选（基于衍生类型）
    if (filters.nodeType !== null && derivedNodeType(node) !== filters.nodeType) return false
    return true
  })
})

// 重置筛选
const resetFilters = () => {
  // 如果是从集群跳转来的，不重置 clusterId
  const clusterName = route.query.clusterName as string
  if (!clusterName) {
    filters.clusterId = null
  }
  filters.status = null
  filters.nodeType = null
}

// 返回到集群监控页面
const goBack = () => {
  router.push({ name: 'cluster' })
}

// 衍生节点类型（增加大内存节点判定）
const derivedNodeType = (node: NodeItem): string => {
  // GPU节点优先
  if (node.gpuCount > 0) return 'GPU节点'
  // CPU计算节点
  if (node.nodeType === 'CPU计算节点') return 'CPU计算节点'
  // 大内存节点判定：memoryTotal > 300GB (300000 MB) 或 节点名称含有mem
  const isLargeMem = (node.memoryTotal && node.memoryTotal > 300000) || node.nodeName.toLowerCase().includes('mem')
  if (isLargeMem && node.nodeType !== 'GPU节点') return '大内存节点'
  // 普通节点
  return '普通节点'
}

// 获取队列数组（兼容多种数据格式）
const getQueuesArray = (queues: any): string[] => {
  if (!queues) return []
  if (Array.isArray(queues)) return queues
  if (typeof queues === 'string') {
    // 尝试解析逗号分隔的字符串或JSON字符串
    if (queues.includes(',')) return queues.split(',').map(q => q.trim())
    try {
      const parsed = JSON.parse(queues)
      return Array.isArray(parsed) ? parsed : [queues]
    } catch {
      return [queues]
    }
  }
  return []
}

// 辅助格式化函数
const formatMemory = (mb: number | null): string => {
  if (mb === null || mb === undefined) return '--'
  if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(0)} MB`
}

const formatMemorySize = (bytes: number | null): string => {
  if (bytes === null || bytes === undefined) return '--'
  if (bytes === 0) return '0'
  const gb = bytes / (1024 ** 3)
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / (1024 ** 2)
  return `${mb.toFixed(0)} MB`
}

const formatCpu = (node: NodeItem): string => {
  if (node.cpuTotal) return `${node.cpuTotal} 核`
  return '--'
}

// 状态样式类
const getStatusClass = (status: string) => {
  return status === 'ok' ? 'status-ok' : 'status-unavail'
}

// 类型样式类
const getTypeClass = (type: string) => {
  switch (type) {
    case 'GPU节点': return 'type-gpu'
    case '大内存节点': return 'type-mem'
    case 'CPU计算节点': return 'type-cpu'
    default: return 'type-normal'
  }
}

// 初始化所有数据（并行加载节点、队列、集群）
const initData = async () => {
  loading.value = true
  try {
    // 并行请求三个接口
    const [nodesRes, queueRes, clusterRes] = await Promise.all([
      getNodeData(),
      getQueueData(),
      getClusterData()
    ])
    
    // 处理节点数据
    const nodesListData = nodesRes.data.nodes || []
    nodeList.value = nodesListData.map((node: any) => ({
      ...node,
      queues: getQueuesArray(node.queues)
    }))
    
    // 处理队列数据（虽然暂未使用，但保留以备后续扩展）
    queueList.value = queueRes.data || []
    
    // 处理集群数据 - 根据实际返回结构提取 clusters 数组
    // 接口返回示例：{ clusters: [...], summary: {...} }
    const clusterData = clusterRes.data || clusterRes
    clusters.value = clusterData.clusters || []
    
    console.log('数据加载完成:', {
      nodes: nodeList.value.length,
      clusters: clusters.value.length
    })
  } catch (error) {
    console.error('初始化数据失败:', error)
    // 出错时保证 clusters 为空数组，避免下拉框报错
    clusters.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await initData()
  // 从 query 参数获取集群名称并设置筛选
  const clusterName = route.query.clusterName as string
  if (clusterName) {
    const cluster = clusters.value.find(c => c.clusterName === clusterName)
    if (cluster) {
      filters.clusterId = cluster.clusterId
    }
  }
})
</script>

<style scoped>
/* 样式保持不变，与原有代码相同 */
.node-monitor-container {
  width: 100%;
  padding: 20px 24px;
  box-sizing: border-box;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.monitor-header {
  margin-bottom: 24px;
}
.header-top {
  margin-bottom: 16px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f7fa;
  border: 1px solid #e2e6ed;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2329;
  cursor: pointer;
  transition: all 0.2s;
}
.back-btn:hover {
  background: #e2e6ed;
}
.back-icon {
  font-size: 16px;
  font-weight: bold;
}
.monitor-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
  margin: 0 0 8px 0;
}
.monitor-header .subtitle {
  font-size: 14px;
  color: #6e7680;
  margin: 0;
}

.filter-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 20px;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}
.filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: #5a6675;
}
.filter-stats {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.stats-badge {
  background-color: #eff1f4;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 13px;
  color: #1f2329;
}

.node-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 24px;
}
@media (max-width: 900px) {
  .node-grid {
    grid-template-columns: 1fr;
  }
}

.node-card {
  background: #fff;
  border: 1px solid #e9edf2;
  border-radius: 16px;
  padding: 18px;
  transition: box-shadow 0.2s, transform 0.1s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.node-card:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}
.node-title h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2329;
}
.node-id {
  font-size: 11px;
  color: #8b92a0;
  background: #f8f9fc;
  padding: 2px 6px;
  border-radius: 20px;
}
.node-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}
.status-badge, .type-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 30px;
}
.status-ok {
  background: #e8f9ef;
  color: #1f8b4c;
}
.status-unavail {
  background: #ffe8e6;
  color: #cb3a2b;
}
.type-gpu {
  background: #eef2ff;
  color: #3b82f6;
}
.type-mem {
  background: #fef3e2;
  color: #d97706;
}
.type-cpu {
  background: #e6f7ff;
  color: #0094cc;
}
.type-normal {
  background: #f0f2f5;
  color: #5a6675;
}

.resource-summary {
  display: flex;
  gap: 16px;
  background: #fafbfc;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 16px;
}
.resource-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.resource-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #8b92a0;
  font-weight: 500;
}
.resource-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2329;
  margin: 4px 0;
}
.resource-sub {
  font-size: 10px;
  color: #6e7680;
}

.gpu-section {
  background: #f8f9fc;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
}
.section-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
  color: #2c3e50;
  letter-spacing: 0.3px;
}
.gpu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.gpu-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  font-size: 12px;
  background: white;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #eef2f6;
}
.gpu-index {
  font-weight: 500;
  color: #2c3e50;
}
.gpu-util {
  color: #3b82f6;
}
.gpu-temp {
  color: #f97316;
}
.gpu-mem {
  color: #10b981;
}
.gpu-model {
  font-size: 11px;
  color: #6e7680;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed #e2e6ed;
}

.full-details {
  margin-top: 8px;
  border-top: 1px solid #eef2f6;
  padding-top: 12px;
}
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 16px;
  font-size: 12px;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.detail-label {
  color: #8b92a0;
  font-weight: 400;
  white-space: nowrap;
  flex-shrink: 0;
}
.detail-value {
  color: #1f2329;
  font-weight: 500;
  text-align: right;
  word-break: break-word;
  white-space: normal;
}
.full-width {
  grid-column: span 2;
}
.queues-item {
  flex-wrap: wrap;
}
.queues-list-full {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  max-width: 100%;
}
.queue-tag {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 14px;
  font-size: 11px;
  color: #2c3e50;
  font-family: monospace;
  white-space: nowrap;
}
@media (max-width: 640px) {
  .queues-list-full {
    justify-content: flex-start;
  }
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 24px;
  color: #6e7680;
  gap: 12px;
}
.empty-state {
  background: transparent;
}

@media (max-width: 640px) {
  .node-monitor-container {
    padding: 16px;
  }
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-stats {
    margin-left: 0;
    justify-content: flex-start;
  }
  .details-grid {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
}
</style>