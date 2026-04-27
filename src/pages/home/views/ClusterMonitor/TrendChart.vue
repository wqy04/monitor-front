<template>
  <div>
    <div class="card-header">
      <h3>关键指标趋势（{{ timeRangeLabel }}）</h3>
      <span class="card-desc">CPU / 内存 / 作业槽使用率变化</span>
    </div>
    <div v-if="!hasValidData" class="empty-tip">暂无趋势数据</div>
    <div v-else ref="chartRef" class="trend-chart"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
// ---------- Props 定义 ----------
interface MetricValue {
  value: number
  timestamp: number
}

interface Metric {
  metricName: string
  unit: string
  values: MetricValue[]
}

interface HistoryData {
  clusterId: number
  clusterName: string
  metrics: Metric[]
}

const props = defineProps<{
  historyData: HistoryData | null
  totalMemory: number
  totalSlots: number
  timeRange?: string    // 新增：时间范围，如 '1h', '1d'
}>()

// DOM 和 图表实例
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 判断是否有有效数据
const hasValidData = ref(false)

// ---------- 数据处理：将原始 metrics 转换为 echarts 需要的 xAxis 和三条折线数据 ----------
interface ProcessedData {
  xAxisLabels: string[]      // 格式化后的时间字符串
  cpuData: number[]          // CPU 利用率 (%)
  memData: number[]          // 内存利用率 (%)
  slotData: number[]         // 作业槽利用率 (%)
}

const timeRangeLabel = computed(() => {
  const map: Record<string, string> = {
    '1h': '最近一小时',
    '6h': '最近六小时',
    '12h': '最近十二小时',
    '1d': '最近一天',
    '7d': '最近七天',
    '30d': '最近三十天',
  }
  // 先检查 timeRange 是否存在且是 map 中的有效键
  if (props.timeRange && map[props.timeRange]) {
    return map[props.timeRange]
  }
  return '最近一小时'
})

const processHistoryData = (): ProcessedData | null => {

  if (!props.historyData || !props.historyData.metrics || props.historyData.metrics.length === 0) {
    console.warn('No history data or metrics')
    return null
  }

  // 1. 从 metrics 中提取 cpuUtil, memFree, slotsUsed
  let cpuMetric: Metric | undefined
  let memFreeMetric: Metric | undefined
  let slotsUsedMetric: Metric | undefined
  

  for (const metric of props.historyData.metrics) {
    if (metric.metricName === 'cpuUtil') cpuMetric = metric
    else if (metric.metricName === 'memFree') memFreeMetric = metric
    else if (metric.metricName === 'slotsUsed') slotsUsedMetric = metric
  }
  

  // 必须三个指标都存在才有意义
  if (!cpuMetric || !memFreeMetric || !slotsUsedMetric) {
    console.warn('缺少必要的指标数据 (cpuUtil/memFree/slotsUsed)', {
      cpuMetric: !!cpuMetric,
      memFreeMetric: !!memFreeMetric,
      slotsUsedMetric: !!slotsUsedMetric
    })
    return null
  }

  // 2. 假设所有指标的时间戳列表是一致的（长度相同且顺序匹配）
  //    我们统一用 cpuMetric 的时间戳顺序来构建
  const timestamps = cpuMetric.values.map(v => v.timestamp)
  const cpuRawValues = cpuMetric.values.map(v => v.value)
  const memFreeValues = memFreeMetric.values.map(v => v.value)
  const slotsUsedValues = slotsUsedMetric.values.map(v => v.value)

  // 3. 计算内存利用率 (%)、作业槽利用率 (%)
  let totalMemoryBytes = props.totalMemory
  let totalSlotsNum = props.totalSlots

  // 如果 totalMemory 为0，尝试从 memFree 数据推断近似总内存
  if (totalMemoryBytes === 0 && memFreeMetric) {
    const maxMemFree = Math.max(...memFreeMetric.values.map(v => v.value))
    // 假设内存利用率不超过80%，推断总内存
    totalMemoryBytes = maxMemFree / 0.2 // 80% 空闲 = 20% 利用
  }

  // 如果 totalSlots 为0，尝试从 slotsUsed 数据推断近似总槽位
  if (totalSlotsNum === 0 && slotsUsedMetric) {
    const maxSlotsUsed = Math.max(...slotsUsedMetric.values.map(v => v.value))
    // 假设槽位利用率不超过90%，推断总槽位
    totalSlotsNum = Math.ceil(maxSlotsUsed / 0.9)
  }

  // 防止除零
  const safeTotalMemory = totalMemoryBytes > 0 ? totalMemoryBytes : 1
  const safeTotalSlots = totalSlotsNum > 0 ? totalSlotsNum : 1
  const cpuFormatted = cpuRawValues.map(v => parseFloat(v.toFixed(2)))
  const memUtilData: number[] = memFreeValues.map(freeBytes => {
    const used = safeTotalMemory - freeBytes
    let rate = (used / safeTotalMemory) * 100
    rate = Math.min(100, Math.max(0, rate))
    return parseFloat(rate.toFixed(2))
  })

  const slotUtilData: number[] = slotsUsedValues.map(used => {
    let rate = (used / safeTotalSlots) * 100
    rate = Math.min(100, Math.max(0, rate))
    return parseFloat(rate.toFixed(2))
  })

  // console.log('Calculated rates (first 5):', {
  //   memUtil: memUtilData.slice(0, 5),
  //   slotUtil: slotUtilData.slice(0, 5),
  //   cpu: cpuFormatted.slice(0, 5)
  // })

  // 4. 格式化 x 轴标签：将时间戳转为 "MM-dd HH:mm"
  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts * 1000)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }

  const xAxisLabels = timestamps.map(ts => formatTimestamp(ts))

  return {
    xAxisLabels,
    cpuData: cpuFormatted,
    memData: memUtilData,
    slotData: slotUtilData,
  }
}

// ---------- 渲染 ECharts ----------
const renderChart = async () => {
  // 1. 先处理数据，检查是否有效
  const processed = processHistoryData()
  if (!processed) {
    hasValidData.value = false
    return
  }

  // 2. 数据有效：显示容器（这会触发模板重新渲染，生成 chartRef 对应的 DOM）
  hasValidData.value = true

  // 3. 等待 Vue 完成 DOM 更新
  await nextTick()

  // 4. 此时 chartRef.value 应该已存在
  if (!chartRef.value) {
    console.warn('chart container still not available')
    return
  }

  // 5. 清理旧图表实例
  if (chart) {
    chart.dispose()
    chart = null
  }

  // 6. 初始化 ECharts
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => `${value}%`,
    },
    legend: {
      data: ['CPU利用率 (%)', '内存利用率 (%)', '作业槽使用率 (%)'],
      bottom: 0,
    },
    grid: {
      left: '5%',
      right: '5%',
      top: '10%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: processed.xAxisLabels,
      boundaryGap: false,
      axisLabel: {
        rotate: processed.xAxisLabels.length > 12 ? 30 : 0,
        interval: Math.ceil(processed.xAxisLabels.length / 10),
      },
    },
    yAxis: {
      type: 'value',
      name: '百分比 (%)',
      min: 0,
      max: 100,
    },
    series: [
      {
        name: 'CPU利用率 (%)',
        type: 'line',
        data: processed.cpuData,
        smooth: true,
        lineStyle: { color: '#3b82f6', width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '内存利用率 (%)',
        type: 'line',
        data: processed.memData,
        smooth: true,
        lineStyle: { color: '#10b981', width: 2 },
        symbol: 'diamond',
        symbolSize: 6,
      },
      {
        name: '作业槽使用率 (%)',
        type: 'line',
        data: processed.slotData,
        smooth: true,
        lineStyle: { color: '#f59e0b', width: 2 },
        symbol: 'rect',
        symbolSize: 6,
      },
    ],
  })
}

// 窗口自适应
const handleResize = () => {
  chart?.resize()
}

// 监听 props 变化，重新渲染
watch(
  () => [props.historyData, props.totalMemory, props.totalSlots],
  () => {
    renderChart()  // 直接调用，无需额外 nextTick
  },
  { deep: true, immediate: true }
)

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
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
.trend-chart {
  width: 100%;
  height: 320px;
}
.empty-tip {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8f959e;
  background: #fafbfc;
  border-radius: 8px;
}
</style>