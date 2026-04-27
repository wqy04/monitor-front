<template>
  <div class="cluster-health-card" :class="{ 'warning-card': healthRate < 85 }">
    <!-- 卡片头部：集群名称 + 健康率标签 + 厂商标签 -->
    <div class="card-header">
      <div class="header-left">
        <h3 class="cluster-name">{{ data.name }}</h3>
        <span class="vendor-tag" v-if="data.vendor">{{ data.vendor }}</span>
      </div>
      <div class="health-rate-tag" :class="{ 'low-rate': healthRate < 85 }">
        健康率 {{ healthRate.toFixed(1) }}%
      </div>
    </div>

    <!-- 卡片主体 -->
    <div class="card-body">
      <!-- 左侧信息区域 -->
      <div class="info-area">
        <!-- 节点统计卡片组 -->
        <div class="node-stats">
          <div class="stat-item">
            <span class="stat-label">节点总数</span>
            <span class="stat-value">{{ data.nodeTotal }}</span>
          </div>
          <div class="stat-item online">
            <span class="stat-label">在线节点</span>
            <span class="stat-value">{{ data.onlineNode }}</span>
          </div>
          <div class="stat-item offline">
            <span class="stat-label">离线节点</span>
            <span class="stat-value">{{ data.offlineNode }}</span>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-group">
          <div class="progress-label">节点健康率</div>
          <div class="progress-bar-wrapper">
            <div
              class="progress-bar-fill"
              :style="{ width: `${healthRate}%` }"
              :class="{ 'low-fill': healthRate < 85 }"
            ></div>
          </div>
          <div class="progress-percent">{{ healthRate.toFixed(1) }}%</div>
        </div>

        <!-- 扩展信息：集群元数据 -->
        <div class="meta-info">
          <div class="info-row" v-if="data.instance">
            <span class="info-label">地址</span>
            <span class="info-value">{{ data.instance }}</span>
          </div>
          <div class="info-row" v-if="data.masterNode">
            <span class="info-label">主节点</span>
            <span class="info-value">{{ data.masterNode }}</span>
          </div>
          <div class="info-row" v-if="data.prometheusJob">
            <span class="info-label">监控任务</span>
            <span class="info-value">{{ data.prometheusJob }}</span>
          </div>
          <div class="info-row" v-if="data.description">
            <span class="info-label">描述</span>
            <span class="info-value description">{{ data.description }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：环形图 -->
      <div ref="chartRef" class="ring-chart"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

// 集群节点状态接口（与父组件保持一致）
interface ClusterNodeStatus {
  clusterId: string
  name: string
  nodeTotal: number
  instance:string
  prometheusJob:string
  vendor:string
  description:string
  masterNode:string
  onlineNode:number
  offlineNode: number
}

const props = defineProps<{
  data: ClusterNodeStatus
}>()

// 计算健康率（保留一位小数）
const healthRate = computed((): number => {
  if (props.data.nodeTotal === 0) return 0
  const rate = (props.data.onlineNode / props.data.nodeTotal) * 100
  return Math.round(rate * 10) / 10
})

// ECharts 实例
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// 初始化或更新环形图
const initRingChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}: ${params.value} 个节点 (${params.percent}%)`
      },
      backgroundColor: 'rgba(0,0,0,0.75)',
      borderColor: '#333',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
    },
    legend: { show: false },
    series: [
      {
        name: '节点健康状态',
        type: 'pie',
        radius: ['55%', '75%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: { scale: true, label: { show: true } },
        data: [
          { value: props.data.onlineNode, name: '在线节点', itemStyle: { color: '#2ba471' } },
          { value: props.data.offlineNode, name: '离线节点', itemStyle: { color: '#e54545' } },
        ],
        animation: true,
        hoverAnimation: true,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: `${healthRate.value.toFixed(1)}%`,
          fill: healthRate.value < 85 ? '#e54545' : '#2ba471',
          fontSize: 14,
          fontWeight: 'bold',
        },
        z: 100,
      },
    ],
  }
  chartInstance.setOption(option, true)
}

// 窗口适配
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听数据变化
watch(
  () => props.data,
  () => {
    nextTick(() => {
      initRingChart()
    })
  },
  { deep: true }
)

onMounted(() => {
  nextTick(() => {
    initRingChart()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.cluster-health-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  border: 1px solid #eef2f6;
}

.cluster-health-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* 健康率低于85%时添加警告边框 */
.warning-card {
  border-left: 4px solid #e54545;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cluster-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
}

.vendor-tag {
  background: #f0f2f5;
  color: #4e5969;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.health-rate-tag {
  background: #e9f4ef;
  color: #2ba471;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.health-rate-tag.low-rate {
  background: #ffece8;
  color: #e54545;
}

.card-body {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.info-area {
  flex: 2;
  min-width: 180px;
}

/* 节点统计卡片组 */
.node-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-item {
  background: #f8f9fc;
  padding: 8px 12px;
  border-radius: 12px;
  text-align: center;
  flex: 1;
}

.stat-item.online .stat-value {
  color: #2ba471;
}

.stat-item.offline .stat-value {
  color: #e54545;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6e7680;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1f2329;
}

/* 进度条 */
.progress-group {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fc;
  padding: 8px 12px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.progress-label {
  font-size: 12px;
  color: #6e7680;
  white-space: nowrap;
}

.progress-bar-wrapper {
  flex: 1;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: #2ba471;
  border-radius: 10px;
  width: 0%;
  transition: width 0.3s ease;
}

.progress-bar-fill.low-fill {
  background-color: #e54545;
}

.progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  min-width: 45px;
  text-align: right;
}

/* 扩展元数据区域 */
.meta-info {
  background: #fafbfc;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 12px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  line-height: 1.4;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 70px;
  flex-shrink: 0;
  color: #8a919f;
}

.info-value {
  flex: 1;
  color: #1f2329;
  word-break: break-all;
}

.info-value.description {
  color: #6e7680;
  font-size: 11px;
}

/* 环形图容器 */
.ring-chart {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .card-body {
    flex-direction: column;
    align-items: stretch;
  }

  .ring-chart {
    align-self: center;
    margin-top: 8px;
  }

  .info-area {
    width: 100%;
  }

  .info-row {
    flex-wrap: wrap;
  }

  .info-label {
    width: auto;
    margin-right: 8px;
  }
}
</style>