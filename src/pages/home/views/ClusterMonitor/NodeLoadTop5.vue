<template>
  <div class="chart-card">
    <div class="card-header">
      <h3>节点负载 Top5</h3>
      <span class="card-desc">按CPU利用率排序</span>
    </div>
    <div class="node-load-list">
      <div v-for="node in nodes" :key="node.nodeName" class="load-item">
        <div class="node-name">{{ node.nodeName }}</div>
        <div class="load-bar-wrapper">
          <div class="load-bar" :style="{ width: node.cpu_util_percent + '%', backgroundColor: node.cpu_util_percent > 80 ? '#ef4444' : '#3b82f6' }"></div>
        </div>
        <div class="load-value">{{ node.cpu_util_percent }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  nodes: Array<{ nodeName: string; cpu_util_percent: number }>
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
.node-load-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.load-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.node-name {
  width: 80px;
  font-size: 13px;
  font-weight: 500;
  color: #1f2329;
}
.load-bar-wrapper {
  flex: 1;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.load-bar {
  height: 100%;
  border-radius: 6px;
}
.load-value {
  width: 45px;
  text-align: right;
  font-size: 13px;
  color: #4b5563;
}
</style>