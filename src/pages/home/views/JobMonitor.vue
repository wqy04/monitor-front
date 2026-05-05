<template>
  <div class="job-monitor-container">
    <!-- 页面标题区 -->
    <div class="monitor-header">
      <div class="header-title">
        <h1>作业监控</h1>
        <p class="subtitle">实时查看集群作业运行状态与队列资源使用情况</p>
      </div>
      <button class="refresh-btn" @click="refreshData" :disabled="loading">
        <svg class="refresh-icon" :class="{ spinning: loading }" viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
        {{ loading ? '加载中...' : '刷新' }}
      </button>
    </div>

    <!-- 统计卡片区 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalRunningJobs }}</div>
          <div class="stat-label">运行中作业</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalPendingJobs }}</div>
          <div class="stat-label">等待作业</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M4 6h16v2H4zm2-4h12v2H6zm14 8H4v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8z"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalQueues }}</div>
          <div class="stat-label">总队列数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ activeQueues }}</div>
          <div class="stat-label">活跃队列</div>
        </div>
      </div>
    </div>

        <!-- 作业列表卡片 -->
    <div class="data-card">
      <div class="card-header">
        <h2>作业列表</h2>
        <span class="card-badge">{{ jobs.length }} 个作业</span>
      </div>
      <div class="table-wrapper">
        <table class="data-table job-table">
          <thead>
            <tr>
              <th>作业ID</th>
              <th>作业名称</th>
              <th>用户</th>
              <th>队列</th>
              <th>执行节点</th>
              <th>运行时长</th>
              <th>CPU利用率</th>
              <th>内存使用</th>
              <th>空闲率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="job in jobs" :key="job.jobId">
              <td class="job-id">{{ job.jobId }}</td>
              <td class="job-name" :title="job.jobName">
                {{ truncateText(job.jobName, 30) }}
              </td>
              <td>{{ job.username }}</td>
              <td>
                <span class="queue-tag">{{ job.queue }}</span>
              </td>
              <td>{{ job.execHost || '--' }}</td>
              <td>{{ formatRuntime(job.runtimeSeconds) }}</td>
              <td>
                <div class="progress-cell">
                  <span class="progress-value">{{ formatPercent(job.cpuUtilPercent) }}</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: Math.min(job.cpuUtilPercent || 0, 100) + '%' }"></div>
                  </div>
                </div>
              </td>
              <td>{{ formatBytes(job.memUsedBytes) }}</td>
              <td>{{ formatPercent(job.idleRate, true) }}</td>
            </tr>
            <tr v-if="jobs.length === 0 && !loading">
              <td colspan="9" class="empty-state">暂无运行中的作业</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 队列概览卡片 -->
    <div class="data-card">
      <div class="card-header">
        <h2>队列概览</h2>
        <span class="card-badge">{{ queues.length }} 个队列</span>
      </div>
      <div class="table-wrapper">
        <table class="data-table queue-table">
          <thead>
            <tr>
              <th>队列名称</th>
              <th>描述</th>
              <th>运行中</th>
              <th>等待中</th>
              <th>挂起</th>
              <th>状态</th>
              <th>优先级</th>
              <th>Nice值</th>
              <th>最大槽位</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="queue in queues" :key="queue.queueId">
              <td class="queue-name">
                <span class="name-highlight">{{ queue.queueName }}</span>
              </td>
              <td class="queue-desc" :title="queue.description">
                {{ truncateText(queue.description || '--', 40) }}
              </td>
              <td>
                <span class="badge-running">{{ queue.jobsRunning || 0 }}</span>
              </td>
              <td>{{ queue.jobsPending || 0 }}</td>
              <td>{{ queue.jobsSuspended || 0 }}</td>
              <td>
                <span class="status-badge" :class="getQueueStatusClass(queue.status)">
                  {{ queue.status || '--' }}
                </span>
              </td>
              <td>{{ queue.priority ?? '--' }}</td>
              <td>{{ queue.nice ?? '--' }}</td>
              <td>{{ queue.maxSlots ?? '无限' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getQueueData } from '@/api/queue'
import { getJobData } from '@/api/job'

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

interface Job {
  jobId: number
  jobName: string
  username: string
  queue: string
  execHost: string
  runtimeSeconds: number
  cpuUtilPercent: number
  memUsedBytes: number
  idleRate: number
  cpuUsageSeconds: number
  cwd: string
  fromHost: string
  status: string | null
}

const loading = ref(false)
const queues = ref<Queue[]>([])
const jobs = ref<Job[]>([])

// 统计计算
const totalRunningJobs = computed(() => {
  return queues.value.reduce((sum, q) => sum + (q.jobsRunning || 0), 0)
})

const totalPendingJobs = computed(() => {
  return queues.value.reduce((sum, q) => sum + (q.jobsPending || 0), 0)
})

const totalQueues = computed(() => queues.value.length)

const activeQueues = computed(() => {
  return queues.value.filter(q => (q.jobsRunning || 0) > 0).length
})

// 工具函数
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '--'
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatRuntime = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '--'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

const formatBytes = (bytes: number): string => {
  if (!bytes && bytes !== 0) return '--'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatPercent = (value: number, isDecimal: boolean = false): string => {
  if (value === undefined || value === null) return '--'
  if (isDecimal) {
    return (value * 100).toFixed(2) + '%'
  }
  return value.toFixed(2) + '%'
}

const getQueueStatusClass = (status: string): string => {
  if (!status) return 'status-unknown'
  if (status.includes('Open') && status.includes('Active')) return 'status-active'
  if (status.includes('Open')) return 'status-open'
  if (status.includes('Closed')) return 'status-closed'
  return 'status-unknown'
}

// 数据加载
const initData = async () => {
  loading.value = true
  try {
    const [queueRes, jobRes] = await Promise.all([
      getQueueData(),
      getJobData()
    ])
    queues.value = queueRes.data?.queues  || []
    jobs.value = jobRes.data?.list || []
    console.log('队列数据：', queues.value)
    console.log('作业数据：', jobs.value)
  } catch (error) {
    console.error('加载数据失败：', error)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  initData()
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
/* 主容器样式 */
.job-monitor-container {
  width: 100%;
  padding: 20px 24px;
  box-sizing: border-box;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 页面头部 */
.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
  margin: 0 0 8px 0;
}

.header-title .subtitle {
  font-size: 14px;
  color: #6e7680;
  margin: 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 20px;
  font-size: 14px;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #eff6ff;
  border-color: #3b82f6;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  transition: transform 0.3s;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue {
  background: #eef2ff;
  color: #3b82f6;
}

.stat-icon.green {
  background: #e8f9ef;
  color: #2c7a44;
}

.stat-icon.orange {
  background: #fff3e6;
  color: #f59e0b;
}

.stat-icon.purple {
  background: #f3e8ff;
  color: #9333ea;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2329;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #8b92a0;
  margin-top: 4px;
}

/* 数据卡片 */
.data-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 16px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f0f2f5;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
}

.card-badge {
  padding: 4px 12px;
  background: #f0f2f5;
  border-radius: 20px;
  font-size: 12px;
  color: #6e7680;
}

/* 表格样式 */
.table-wrapper {
  overflow-x: auto;
  padding: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead tr {
  background: #f8f9fc;
  border-bottom: 1px solid #e2e6ed;
}

.data-table th {
  text-align: left;
  padding: 14px 16px;
  font-weight: 600;
  color: #5a6270;
  font-size: 13px;
  white-space: nowrap;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f0f2f5;
  color: #2c3e50;
}

.data-table tbody tr:hover {
  background: #fafbfd;
}

/* 队列表格特定样式 */
.queue-name .name-highlight {
  font-weight: 600;
  color: #1f2329;
}

.queue-desc {
  max-width: 280px;
  color: #8b92a0;
  font-size: 12px;
}

.badge-running {
  display: inline-block;
  padding: 2px 10px;
  background: #e8f9ef;
  color: #2c7a44;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-active {
  background: #e8f9ef;
  color: #2c7a44;
}

.status-open {
  background: #eef2ff;
  color: #3b82f6;
}

.status-closed {
  background: #ffe8e6;
  color: #cb3a2b;
}

.status-unknown {
  background: #f0f2f5;
  color: #8b92a0;
}

/* 作业表格特定样式 */
.job-id {
  font-family: monospace;
  font-weight: 600;
  color: #3b82f6;
}

.job-name {
  max-width: 280px;
  font-family: monospace;
  font-size: 12px;
  color: #5a6270;
}

.queue-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #eef2ff;
  color: #3b82f6;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

/* 进度条组件 */
.progress-cell {
  min-width: 100px;
}

.progress-value {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  margin-right: 8px;
  color: #2c3e50;
}

.progress-bar {
  display: inline-block;
  width: 60px;
  height: 4px;
  background: #e2e6ed;
  border-radius: 2px;
  overflow: hidden;
  vertical-align: middle;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2b9eff);
  border-radius: 2px;
  transition: width 0.3s;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 48px !important;
  color: #8b92a0;
  font-size: 14px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .job-monitor-container {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    padding: 14px 16px;
  }
  
  .data-table th,
  .data-table td {
    padding: 10px 12px;
  }
  
  .queue-desc {
    max-width: 150px;
  }
  
  .job-name {
    max-width: 150px;
  }
  
  .progress-cell {
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .monitor-header {
    flex-direction: column;
  }
  
  .refresh-btn {
    align-self: flex-start;
  }
}
</style>