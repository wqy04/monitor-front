<template>
  <div class="top5-card">
    <div class="card-header">
      <h3>节点负载 Top5（按 CPU 使用率）</h3>
      <span class="tip">实时排名</span>
    </div>
    <div class="node-list">
      <div v-for="(node, idx) in topNodes" :key="node.nodeId" class="node-row">
        <div class="rank">{{ idx + 1 }}</div>
        <div class="node-info">
          <div class="node-name">{{ node.nodeName }}</div>
          <div class="node-cluster">{{ node.clusterName }}</div>
        </div>
        <div class="metrics">
          <div class="metric-item">
            <span class="label">CPU</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: node.cpuUsagePercent + '%', backgroundColor: getCpuColor(node.cpuUsagePercent) }"></div>
            </div>
            <span class="value">{{ node.cpuUsagePercent }}%</span>
          </div>
          <div class="metric-item" v-if="node.gpuUtilAvg !== undefined">
            <span class="label">GPU</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: node.gpuUtilAvg + '%', backgroundColor: '#ee6666' }"></div>
            </div>
            <span class="value">{{ node.gpuUtilAvg }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  nodes: any[]   // 节点列表
  clusters: any[] // 集群列表
}>()

// 计算 Top5 节点
const topNodes = computed(() => {
  if (!props.nodes || props.nodes.length === 0) return []

  // 1. 只保留状态正常的节点
  const healthyNodes = props.nodes.filter(node => node.status === 'ok')

  // 2. 计算每个节点的 GPU 平均使用率（如果有 GPU）
  const nodesWithGpu = healthyNodes.map(node => {
    let gpuUtilAvg: number | undefined = undefined
    if (node.gpuCount > 0 && node.gpuMetrics && Array.isArray(node.gpuMetrics)) {
      const totalUtil = node.gpuMetrics.reduce((sum: number, gpu: any) => sum + (gpu.util_percent || 0), 0)
      gpuUtilAvg = totalUtil / node.gpuMetrics.length
    }
    // 获取集群名称
    const cluster = props.clusters.find(c => c.clusterId === node.clusterId)
    const clusterName = cluster ? (cluster.clusterName || cluster.description || '未知集群') : '未知集群'

    return {
      nodeId: node.nodeId,
      nodeName: node.nodeName,
      clusterName: clusterName,
      cpuUsagePercent: Number(node.cpu_util_percent) || 0,
      gpuUtilAvg: gpuUtilAvg
    }
  })

  // 3. 按 CPU 使用率降序排序，取前 5
  return nodesWithGpu.sort((a, b) => b.cpuUsagePercent - a.cpuUsagePercent).slice(0, 5)
})

const getCpuColor = (percent: number) => {
  if (percent >= 80) return '#e54545'
  if (percent >= 60) return '#e6a23c'
  return '#67c23a'
}
</script>

<style scoped>
.top5-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e6ed;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  margin-top: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 20px;
}
.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.tip {
  font-size: 12px;
  color: #8a929f;
}
.node-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.node-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.rank {
  width: 28px;
  height: 28px;
  background: #f5f7fa;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #1f2329;
}
.node-info {
  width: 140px;
}
.node-name {
  font-weight: 500;
  font-size: 14px;
}
.node-cluster {
  font-size: 11px;
  color: #8a929f;
}
.metrics {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.metric-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.label {
  width: 32px;
  font-size: 12px;
  color: #5e6673;
}
.progress-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.2s;
}
.value {
  width: 38px;
  font-size: 12px;
  font-weight: 500;
  text-align: right;
}
@media (max-width: 680px) {
  .node-row { flex-wrap: wrap; }
  .node-info { width: 100%; margin-left: 44px; }
  .metrics { margin-left: 44px; width: calc(100% - 44px); }
}
</style>