<template>
  <n-card class="kpi-card" hoverable>
    <div class="card-content">
      <!-- 图标区域 -->
      <div class="icon-wrapper" :style="{ backgroundColor: bgColor }">
        <img :src="iconUrl" alt="icon" class="iconimg" />
      </div>
      
      <!-- 信息区域 -->
      <div class="info">
        <p class="label">{{ label }}</p>
        <div class="value">
          <!-- 支持自定义数值内容（用于复杂展示，如离线节点） -->
          <slot name="value">
            {{ value }}{{ suffix }}
          </slot>
        </div>
        <p class="desc">{{ desc }}</p>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'

// 定义 props
const props = defineProps<{
  type: 'cluster' | 'node' | 'running' | 'pending' | 'alert' | 'device'
  label: string
  desc: string
  value?: string | number
  suffix?: string
}>()

// 图片基础路径
const imgBaseUrl = import.meta.env.VITE_IMG_BASE_URL

// 类型到图标的映射
const iconMap = {
  cluster: `${imgBaseUrl}/images/dashboard/clusterTotal.png`,
  node: `${imgBaseUrl}/images/dashboard/nodeTotal.png`,
  running: `${imgBaseUrl}/images/dashboard/runningJob.png`,
  pending: `${imgBaseUrl}/images/dashboard/pendingJob.png`,
  alert: `${imgBaseUrl}/images/dashboard/unsolvedAlert.png`,
  device: `${imgBaseUrl}/images/dashboard/deviceOnlineRate.png`
}

// 类型到背景色的映射
const bgColorMap = {
  cluster: '#e8f3ff',
  node: '#f0f7ff',
  running: '#e6fffb',
  pending: '#fff7e6',
  alert: '#fff2f0',
  device: '#f9f0ff'
}

// 计算图标 URL
const iconUrl = computed(() => iconMap[props.type])
// 计算背景色
const bgColor = computed(() => bgColorMap[props.type])
</script>

<style scoped>
.kpi-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.kpi-card :deep(.n-card__content) {
  padding: 0;
}

.card-content {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  gap: 20px;
}

.icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.iconimg {
  width: 32px;
  height: 32px;
}

.info {
  flex: 1;
}

.label {
  font-size: 14px;
  color: #6e7680;
  margin: 0 0 8px 0;
}

.value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2329;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.desc {
  font-size: 12px;
  color: #a9aeb8;
  margin: 0;
}

/* 离线节点特殊样式 */
.offline-text {
  font-size: 20px;
  color: #ff4d4f;
}
</style>