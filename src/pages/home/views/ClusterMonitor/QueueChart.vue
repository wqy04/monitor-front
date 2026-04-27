<template>
  <div class="chart-card">
    <div class="card-header">
      <h3>队列作业分布</h3>
      <span class="card-desc">各队列运行作业数</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  cluster: {
    queueJobs: Array<{ queueName: string; runningJobs: number }>
  }
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const renderChart = () => {
  if (!chartRef.value || !props.cluster.queueJobs) return
  if (chart) chart.dispose()
  chart = echarts.init(chartRef.value)
  const queues = props.cluster.queueJobs.map(q => q.queueName)
  const runningJobs = props.cluster.queueJobs.map(q => q.runningJobs)
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '10%', right: '5%', top: '10%', bottom: '5%', containLabel: true },
    xAxis: { type: 'category', data: queues, axisLabel: { rotate: 30, interval: 0 } },
    yAxis: { type: 'value', name: '运行作业数' },
    series: [{
      name: '运行作业数',
      type: 'bar',
      data: runningJobs,
      itemStyle: { borderRadius: [4, 4, 0, 0], color: '#6366f1' },
      label: { show: true, position: 'top' },
    }],
  })
}

const handleResize = () => chart?.resize()

onMounted(() => {
  nextTick(renderChart)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(() => props.cluster, () => {
  nextTick(renderChart)
}, { deep: true })
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
}
</style>