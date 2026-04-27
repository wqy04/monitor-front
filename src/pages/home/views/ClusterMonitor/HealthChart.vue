<template>
  <div class="chart-card">
    <div class="card-header">
      <h3>节点健康度</h3>
      <span class="card-desc">在线 / 离线节点比例</span>
    </div>
    <div ref="chartRef" class="chart-container"></div>
    <div class="health-stats">
      <div class="stat-item">
        <span class="dot online"></span> 在线节点
        <strong>{{ cluster.onlineNode }}</strong>
      </div>
      <div class="stat-item">
        <span class="dot offline"></span> 离线节点
        <strong>{{ cluster.offlineNode }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  cluster: {
    onlineNode: number
    offlineNode: number
  }
}>()

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
// console.log('HealthChart props:', props.cluster) // 调试输出

const renderChart = () => {
  if (!chartRef.value) return
  if (chart) chart.dispose()
  chart = echarts.init(chartRef.value)
  const { onlineNode, offlineNode } = props.cluster
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['55%', '80%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { scale: true },
      data: [
        { value: onlineNode, name: '在线节点', itemStyle: { color: '#10b981' } },
        { value: offlineNode, name: '离线节点', itemStyle: { color: '#ef4444' } },
      ],
    }],
    graphic: [{
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: `${onlineNode}\n在线`,
        fill: '#1f2329',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
      },
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
  height: 220px;
}
.health-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 12px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 10px;
  display: inline-block;
}
.online { background-color: #10b981; }
.offline { background-color: #ef4444; }
</style>