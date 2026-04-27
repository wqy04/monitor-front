<template>
  <div class="kpi-card-wrapper">
    <div class="kpi-card">
      <div class="kpi-icon cluster-icon"></div>
      <div class="kpi-content">
        <div class="kpi-label">集群总数</div>
        <div class="kpi-value">{{ stats.clusterCount }}</div>
        <div class="kpi-desc">已接入集群</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon node-icon"></div>
      <div class="kpi-content">
        <div class="kpi-label">节点总数 / 离线</div>
        <div class="kpi-value">
          {{ stats.totalNodes }}
          <span class="offline-text">/ {{ stats.offlineNodes }}</span>
        </div>
        <div class="kpi-desc">物理节点状态</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon cpu-icon"></div>
      <div class="kpi-content">
        <div class="kpi-label">总CPU核心数</div>
        <div class="kpi-value">{{ stats.totalCpuCores }}</div>
        <div class="kpi-desc">集群算力池</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon gpu-icon"></div>
      <div class="kpi-content">
        <div class="kpi-label">总GPU数量</div>
        <div class="kpi-value">{{ stats.totalGpus }}</div>
        <div class="kpi-desc">加速卡总数</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon slot-icon"></div>
      <div class="kpi-content">
        <div class="kpi-label">作业槽使用率</div>
        <div class="kpi-value">{{ stats.slotUsageRate }}%</div>
        <div class="kpi-desc">已用槽 / 总槽</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon alert-icon"></div>
      <div class="kpi-content">
        <div class="kpi-label">活跃告警</div>
        <div class="kpi-value">{{ stats.activeAlerts }}</div>
        <div class="kpi-desc">未解决告警</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    clusterCount: number
    totalNodes: number
    offlineNodes: number
    totalCpuCores: number
    totalGpus: number
    slotUsageRate: number
    activeAlerts: number
  }
}>()
</script>

<style scoped>
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
.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
}
.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #eef2ff;
}
.cluster-icon { background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%233b82f6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>') no-repeat center; background-size: 28px; }
.node-icon { background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%2310b981"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/></svg>') no-repeat center; background-size: 28px; }
.cpu-icon { background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%23f59e0b"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>') no-repeat center; background-size: 28px; }
.gpu-icon { background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%238b5cf6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>') no-repeat center; background-size: 28px; }
.slot-icon { background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%23ec489a"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>') no-repeat center; background-size: 28px; }
.alert-icon { background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%23ef4444"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>') no-repeat center; background-size: 28px; }
.kpi-content {
  flex: 1;
}
.kpi-label {
  font-size: 14px;
  color: #6e7680;
  margin-bottom: 6px;
}
.kpi-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2329;
  line-height: 1.2;
}
.offline-text {
  color: #e54545;
  font-weight: 500;
  margin-left: 4px;
}
.kpi-desc {
  font-size: 12px;
  color: #8f959e;
  margin-top: 6px;
}
@media (max-width: 1200px) {
  .kpi-card-wrapper { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .kpi-card-wrapper { grid-template-columns: 1fr; }
}
</style>