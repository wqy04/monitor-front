<template>
  <div class="chart-card">
    <div class="card-header">
      <h3>资源使用率</h3>
      <span class="card-desc">CPU / 内存 / 作业槽</span>
    </div>
    <div class="gauge-list">
      <div class="gauge-item">
        <div class="gauge-label">CPU 利用率</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: cluster.cpuUtilAvg.toFixed(1) + '%', backgroundColor: '#3b82f6' }"></div>
        </div>
        <div class="gauge-value">{{ cluster.cpuUtilAvg.toFixed(1) }}%</div>
      </div>
      <div class="gauge-item">
        <div class="gauge-label">内存利用率</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (cluster.memoryTotal-cluster.memoryFreeTotal)/cluster.memoryTotal * 100 + '%', backgroundColor: '#10b981' }"></div>
        </div>
        <div class="gauge-value">{{ ((cluster.memoryTotal-cluster.memoryFreeTotal)/cluster.memoryTotal * 100).toFixed(1) }}%</div>
      </div>
      <div class="gauge-item">
        <div class="gauge-label">作业槽使用率</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: cluster.slotsUsedTotal/cluster.slotsMaxTotal * 100 + '%', backgroundColor: '#f59e0b' }"></div>
        </div>
        <div class="gauge-value">{{ (cluster.slotsUsedTotal/cluster.slotsMaxTotal * 100).toFixed(1) }}%</div>
      </div>
      <!-- <div class="gauge-item" v-if="cluster.gpuUsage !== undefined">
        <div class="gauge-label">GPU 利用率</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: cluster.gpuUsage + '%', backgroundColor: '#8b5cf6' }"></div>
        </div>
        <div class="gauge-value">{{ cluster.gpuUsage }}%</div>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  cluster: {
    cpuUtilAvg: number
    memoryTotal: number
    memoryFreeTotal:number
    slotsMaxTotal: number
    slotsUsedTotal: number
  }
}>()
</script>

<style scoped>
.chart-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}
.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.card-desc {
  font-size: 12px;
  color: #8f959e;
}
.gauge-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.gauge-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.gauge-label {
  width: 90px;
  font-size: 14px;
  color: #4b5563;
}
.progress-bar {
  flex: 1;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s;
}
.gauge-value {
  width: 45px;
  text-align: right;
  font-weight: 500;
  font-size: 14px;
}
</style>