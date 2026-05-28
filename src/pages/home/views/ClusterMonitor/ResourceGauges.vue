<template>
  <div class="chart-card">
    <div class="card-header">
      <h3>资源使用率</h3>
      <span class="card-desc">CPU / 内存 / 作业槽</span>
    </div>
    <div class="gauge-list">
      <!-- CPU 利用率 -->
      <div class="gauge-item">
        <div class="gauge-label">CPU 利用率</div>
        <div class="progress-bar">
          <div
            v-if="cpuValid"
            class="progress-fill"
            :style="{ width: cpuPercent + '%', backgroundColor: '#3b82f6' }"
          ></div>
          <div v-else class="progress-bar-placeholder"></div>
        </div>
        <div class="gauge-value">
          <span v-if="cpuValid">{{ cpuPercent.toFixed(1) }}%</span>
          <span v-else-if="!hasOnlineNode" class="text-muted">节点离线</span>
          <span v-else class="text-muted">无数据</span>
        </div>
      </div>

      <!-- 内存利用率 -->
      <div class="gauge-item">
        <div class="gauge-label">内存利用率</div>
        <div class="progress-bar">
          <div
            v-if="memoryValid"
            class="progress-fill"
            :style="{ width: memoryPercent + '%', backgroundColor: '#10b981' }"
          ></div>
          <div v-else class="progress-bar-placeholder"></div>
        </div>
        <div class="gauge-value">
          <span v-if="memoryValid">{{ memoryPercent.toFixed(1) }}%</span>
          <span v-else-if="!hasOnlineNode" class="text-muted">节点离线</span>
          <span v-else class="text-muted">无数据</span>
        </div>
      </div>

      <!-- 作业槽使用率 -->
      <div class="gauge-item">
        <div class="gauge-label">作业槽使用率</div>
        <div class="progress-bar">
          <div
            v-if="slotsValid"
            class="progress-fill"
            :style="{ width: slotsPercent + '%', backgroundColor: '#f59e0b' }"
          ></div>
          <div v-else class="progress-bar-placeholder"></div>
        </div>
        <div class="gauge-value">
          <span v-if="slotsValid">{{ slotsPercent.toFixed(1) }}%</span>
          <span v-else-if="!hasOnlineNode" class="text-muted">节点离线</span>
          <span v-else class="text-muted">无数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  cluster: {
    cpuUtilAvg: number | null
    memoryTotal: number
    memoryFreeTotal: number | null
    slotsMaxTotal: number
    slotsUsedTotal: number
    onlineNode: number   // 新增：在线节点数
  }
}>()

// 是否有在线节点
const hasOnlineNode = computed(() => props.cluster.onlineNode > 0)

// CPU 有效：有在线节点 且 cpuUtilAvg 不为 null 且 >=0
const cpuValid = computed(() => {
  return hasOnlineNode.value && props.cluster.cpuUtilAvg != null && props.cluster.cpuUtilAvg >= 0
})
const cpuPercent = computed(() => (cpuValid.value ? props.cluster.cpuUtilAvg! : 0))

// 内存有效：有在线节点、memoryFreeTotal 不为 null、总内存 >0
const memoryValid = computed(() => {
  return (
    hasOnlineNode.value &&
    props.cluster.memoryFreeTotal != null &&
    props.cluster.memoryTotal > 0
  )
})
const memoryPercent = computed(() => {
  if (!memoryValid.value) return 0
  const used = props.cluster.memoryTotal - props.cluster.memoryFreeTotal!
  return (used / props.cluster.memoryTotal) * 100
})

// 作业槽有效：有在线节点、最大槽位 >0
const slotsValid = computed(() => {
  return hasOnlineNode.value && props.cluster.slotsMaxTotal > 0
})
const slotsPercent = computed(() => {
  if (!slotsValid.value) return 0
  return (props.cluster.slotsUsedTotal / props.cluster.slotsMaxTotal) * 100
})
</script>

<style scoped>
.chart-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
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
.progress-bar-placeholder {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 10px;
  background-image: repeating-linear-gradient(
    45deg,
    #cbd5e1 0px,
    #cbd5e1 4px,
    #e2e8f0 4px,
    #e2e8f0 8px
  );
}
.gauge-value {
  width: 75px;
  text-align: right;
  font-weight: 500;
  font-size: 14px;
}
.text-muted {
  color: #9ca3af;
}
</style>