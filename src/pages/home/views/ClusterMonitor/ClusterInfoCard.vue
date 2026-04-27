<template>
  <div class="info-card">
    <div class="card-header">
      <h3>集群元信息</h3>
    </div>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">集群ID</span>{{ cluster.clusterId }}</div>
      <div class="info-item"><span class="info-label">厂商</span>{{ cluster.vendor }}</div>
      <div class="info-item"><span class="info-label">Master节点</span>{{ cluster.masterNode }}</div>
      <div class="info-item"><span class="info-label">监控实例</span>{{ cluster.instance }}</div>
      <div class="info-item"><span class="info-label">描述</span>{{ cluster.description }}</div>
      <div class="info-item"><span class="info-label">Prometheus Job</span>{{ cluster.prometheusJob }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  cluster: {
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
}>()
</script>

<style scoped>
.info-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
}
.card-header {
  margin-bottom: 16px;
}
.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 8px;
}
.info-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}
.info-label {
  color: #6e7680;
  width: 100px;
}
@media (max-width: 1200px) {
  .info-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>