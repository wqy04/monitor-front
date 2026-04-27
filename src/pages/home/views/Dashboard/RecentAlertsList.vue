<template>
  <div class="alerts-card">
    <div class="card-header">
      <h3>最近未解决告警</h3>
      <span class="badge">{{ props.total }} 条待处理</span>
    </div>
    <div class="alerts-list">
      <div v-for="alert in alerts" :key="alert.id" class="alert-item">
        <div class="alert-level" :class="levelClass(alert.level)">
          {{ levelText(alert.level) }}
        </div>
        <div class="alert-content">
          <div class="alert-notice">{{ alert.notice }}</div>
          <div class="alert-meta">
            <span class="cluster">{{ alert.clusterName }}</span>
            <span class="target">{{ alert.target }}</span>
            <span class="time">{{ formatTime(alert.updateTime) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="card-footer">
      <a href="#" @click.prevent="goToAlerts">查看更多告警 →</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

interface Alert {
  id: number
  notice: string
  target: string
  level: number
  updateTime: string
  clusterName: string
}

const props = defineProps<{
  alerts: Alert[]
  total: number
}>()

const levelClass = (level: number) => {
  switch (level) {
    case 3: return 'critical'
    case 2: return 'warning'
    default: return 'info'
  }
}
const levelText = (level: number) => {
  switch (level) {
    case 3: return '严重'
    case 2: return '警告'
    default: return '提示'
  }
}
const formatTime = (iso: string) => {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
const goToAlerts = () => {
  router.push('/home/alarm')
}
</script>

<style scoped>
/* 原有样式保持不变，新增 .cluster 样式 */
.alerts-card {
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.badge {
  background: #f0f2f5;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  color: #1f2329;
}
.alerts-list {
  flex: 1;
}
.alert-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #eff2f6;
}
.alert-item:last-child {
  border-bottom: none;
}
.alert-level {
  width: 44px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 0;
  border-radius: 16px;
  align-self: center;
}
.alert-level.critical {
  background: #ffe6e6;
  color: #e54545;
}
.alert-level.warning {
  background: #fff3e0;
  color: #e6a23c;
}
.alert-level.info {
  background: #e6f7ff;
  color: #409eff;
}
.alert-content {
  flex: 1;
}
.alert-notice {
  font-size: 14px;
  color: #1f2329;
  margin-bottom: 6px;
}
.alert-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8a929f;
  flex-wrap: wrap;
}
.cluster {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
}
.target {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}
.card-footer {
  margin-top: 12px;
  text-align: right;
}
.card-footer a {
  color: #409eff;
  text-decoration: none;
  font-size: 13px;
}
</style>