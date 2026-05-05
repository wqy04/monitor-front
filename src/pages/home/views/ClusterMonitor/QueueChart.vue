<template>
  <div class="chart-card">
    <div class="card-header">
      <h3>队列作业分布Top5</h3>
      <span class="card-desc">各队列运行作业数</span>
    </div>
    
    <!-- 队列信息列表 -->
    <div class="queue-info-section">
      <div class="queue-list">
        <div v-for="queue in top5Queues" :key="queue.queueId" class="queue-item">
          <span class="queue-name">{{ queue.queueName }}</span>
          <span class="job-count">{{ queue.totalJobs }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'

interface Queue {
  queueId: number
  queueName: string
  jobsRunning: number
  jobsPending: number
  jobsSuspended: number
  description: string
  status: string
  priority: number
  nice: number
  maxSlots: number | null
}

const props = defineProps<{
  cluster: {
    queues?: Queue[]
  }
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 计算前五队列
const top5Queues = computed(() => {
  if (!props.cluster.queues) return []
  const queuesWithTotal = props.cluster.queues.map(queue => ({
    ...queue,
    totalJobs: (queue.jobsRunning || 0) + (queue.jobsPending || 0) + (queue.jobsSuspended || 0)
  }))
  return queuesWithTotal
    .sort((a, b) => b.totalJobs - a.totalJobs)
    .slice(0, 5)
})
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
.chart-container {
  width: 100%;
  height: 280px;
  margin-bottom: 20px;
}

.queue-info-section {
  padding-top:0px;
}

.queue-info-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #374151;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.queue-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.job-count {
  font-size: 14px;
  font-weight: 600;
  color: #6366f1;
}
</style>