<template>
  <div class="cluster-tabs">
    <button
      v-for="cluster in clusters"
      :key="cluster.clusterId"
      :class="['cluster-tab', { active: selectedId === cluster.clusterId }]"
      @click="$emit('select', cluster.clusterId)"
    >
      {{ cluster.clusterName }}
      <span v-if="cluster.status === 'unhealthy'" class="badge-warning">异常</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  clusters: Array<any>
  selectedId: number
}>()
defineEmits<{
  (e: 'select', clusterId: number): void
}>()
</script>

<style scoped>
.cluster-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid #e2e6ed;
  padding-bottom: 8px;
}
.cluster-tab {
  background: transparent;
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #6e7680;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cluster-tab:hover {
  background-color: #eef2ff;
  color: #1f2329;
}
.cluster-tab.active {
  background-color: #eef2ff;
  color: #3b82f6;
}
.badge-warning {
  background-color: #fee2e2;
  color: #ef4444;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 12px;
}
</style>