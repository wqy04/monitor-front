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

    <!-- 作业列表卡片（含筛选栏） -->
    <div class="data-card">
      <div class="card-header">
        <h2>作业列表</h2>
        <span class="card-badge">{{ filteredJobs.length }} 个作业（过滤后）</span>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-item">
          <label>队列：</label>
          <select v-model="filterQueue" class="filter-select">
            <option value="">全部队列</option>
            <option v-for="q in queueFilterOptions" :key="q" :value="q">{{ q }}</option>
          </select>
        </div>
        <!-- 用户筛选框仅对管理员可见 -->
        <div class="filter-item" v-if="isAdmin">
          <label>用户：</label>
          <select v-model="filterUser" class="filter-select">
            <option value="">全部用户</option>
            <option v-for="u in uniqueUsers" :key="u" :value="u">{{ u }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label>搜索：</label>
          <input type="text" v-model="searchText" placeholder="作业ID/名称" class="filter-input" />
        </div>
        <button class="filter-reset" @click="resetFilters">重置</button>
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
            <tr v-for="job in paginatedJobs" :key="job.jobId">
              <td class="job-id">{{ job.jobId }}</td>
              <td class="job-name" :title="job.jobName">{{ truncateText(job.jobName, 30) }}</td>
              <td>{{ job.username }}</td>
              <td><span class="queue-tag">{{ job.queue }}</span></td>
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
            <tr v-if="filteredJobs.length === 0 && !loading">
              <td colspan="9" class="empty-state">未找到符合条件的作业</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页组件 -->
      <div class="pagination" v-if="filteredJobs.length > 0">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页，共 {{ filteredJobs.length }} 条</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
        <div class="page-jump">
          跳至
          <input type="number" v-model.number="jumpPage" @keyup.enter="goToPage" min="1" :max="totalPages" class="jump-input" />
          页
        </div>
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
              <td class="queue-name"><span class="name-highlight">{{ queue.queueName }}</span></td>
              <td class="queue-desc" :title="queue.description">{{ truncateText(queue.description || '--', 40) }}</td>
              <td><span class="badge-running">{{ queue.jobsRunning || 0 }}</span></td>
              <td>{{ queue.jobsPending || 0 }}</td>
              <td>{{ queue.jobsSuspended || 0 }}</td>
              <td><span class="status-badge" :class="getQueueStatusClass(queue.status)">{{ queue.status || '--' }}</span></td>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { getQueueData } from '@/api/queue'
import request from '@/utils/request'

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

// 获取用户Store信息
const userStore = useUserStore()
const currentUser = computed(() => userStore.userInfo)
// 判断是否为管理员（userRole === 0 表示管理员）
const isAdmin = computed(() => currentUser.value?.userRole === 0)

const loading = ref(false)
const queues = ref<Queue[]>([])
const allJobs = ref<Job[]>([])                 // 后端全部作业（一次拉取）

// 筛选与分页状态
const filterQueue = ref('')
const filterUser = ref('')
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(20)                      // 每页显示条数
const jumpPage = ref(1)

/**
 * 权限过滤后的作业列表
 * - 管理员：可以看到所有作业
 * - 普通用户：只能看到自己的作业（根据 username 匹配）
 */
const authorizedJobs = computed(() => {
  if (!allJobs.value.length) return []
  if (isAdmin.value) return allJobs.value
  const currentUsername = currentUser.value?.username
  if (!currentUsername) return []
  return allJobs.value.filter(job => job.username === currentUsername)
})

/**
 * 队列下拉选项
 * - 管理员：显示所有队列（基于 allJobs）
 * - 普通用户：只显示自己作业中出现的队列（基于 authorizedJobs）
 */
const queueFilterOptions = computed(() => {
  const sourceJobs = isAdmin.value ? allJobs.value : authorizedJobs.value
  const queuesSet = new Set(sourceJobs.map(j => j.queue).filter(Boolean))
  return Array.from(queuesSet).sort()
})

/**
 * 用户下拉选项（仅管理员会用到这个下拉框）
 * 基于全量作业 allJobs 获取所有用户列表
 */
const uniqueUsers = computed(() => {
  const usersSet = new Set(allJobs.value.map(j => j.username).filter(Boolean))
  return Array.from(usersSet).sort()
})

/**
 * 最终用于展示的作业列表（在权限过滤的基础上再进行队列、用户、搜索筛选）
 */
const filteredJobs = computed(() => {
  let jobs = authorizedJobs.value

  // 队列筛选
  if (filterQueue.value) {
    jobs = jobs.filter(j => j.queue === filterQueue.value)
  }

  // 用户筛选（仅管理员生效，普通用户不会显示该筛选框，filterUser 始终为空）
  if (isAdmin.value && filterUser.value) {
    jobs = jobs.filter(j => j.username === filterUser.value)
  }

  // 搜索筛选（作业ID 或 作业名称）
  if (searchText.value) {
    const lowerSearch = searchText.value.toLowerCase()
    jobs = jobs.filter(j =>
      String(j.jobId).includes(lowerSearch) ||
      (j.jobName && j.jobName.toLowerCase().includes(lowerSearch))
    )
  }

  return jobs
})

// 总页数
const totalPages = computed(() => Math.ceil(filteredJobs.value.length / pageSize.value))

// 分页后的作业
const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredJobs.value.slice(start, end)
})

// 统计计算（基于队列数据，保持不变）
const totalRunningJobs = computed(() => queues.value.reduce((sum, q) => sum + (q.jobsRunning || 0), 0))
const totalPendingJobs = computed(() => queues.value.reduce((sum, q) => sum + (q.jobsPending || 0), 0))
const totalQueues = computed(() => queues.value.length)
const activeQueues = computed(() => queues.value.filter(q => (q.jobsRunning || 0) > 0).length)

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
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
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
  if (isDecimal) return (value * 100).toFixed(2) + '%'
  return value.toFixed(2) + '%'
}

const getQueueStatusClass = (status: string): string => {
  if (!status) return 'status-unknown'
  if (status.includes('Open') && status.includes('Active')) return 'status-active'
  if (status.includes('Open')) return 'status-open'
  if (status.includes('Closed')) return 'status-closed'
  return 'status-unknown'
}

// 重置所有筛选条件
const resetFilters = () => {
  filterQueue.value = ''
  filterUser.value = ''
  searchText.value = ''
  currentPage.value = 1
  jumpPage.value = 1
}

// 跳转到指定页
const goToPage = () => {
  let page = jumpPage.value
  if (isNaN(page)) page = 1
  page = Math.min(Math.max(page, 1), totalPages.value)
  currentPage.value = page
  jumpPage.value = page
}

// 监听筛选变化，重置当前页为第一页
watch([filterQueue, filterUser, searchText], () => {
  currentPage.value = 1
  jumpPage.value = 1
})

// 初始化数据（队列 + 作业）
const initData = async () => {
  loading.value = true
  try {
    const [queueResp, jobResp] = await Promise.all([
      getQueueData(),
      request.get('/jobs', { params: { pageNum: 1, pageSize: 10000 } })
    ])
    queues.value = queueResp.data?.queues || []
    allJobs.value = jobResp.data?.list || []
    console.log('加载的作业数据:', allJobs.value)
  } catch (error) {
    console.error('加载数据失败：', error)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  initData()
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
/* 原有样式保持不变，新增筛选栏和分页样式 */
.job-monitor-container {
  width: 100%;
  padding: 20px 24px;
  box-sizing: border-box;
  background-color: #f5f7fa;
  min-height: 100vh;
}

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

.stat-icon.blue { background: #eef2ff; color: #3b82f6; }
.stat-icon.green { background: #e8f9ef; color: #2c7a44; }
.stat-icon.orange { background: #fff3e6; color: #f59e0b; }
.stat-icon.purple { background: #f3e8ff; color: #9333ea; }

.stat-info { flex: 1; }
.stat-value { font-size: 28px; font-weight: 700; color: #1f2329; line-height: 1.2; }
.stat-label { font-size: 13px; color: #8b92a0; margin-top: 4px; }

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

.card-header h2 { font-size: 18px; font-weight: 600; color: #1f2329; margin: 0; }
.card-badge { padding: 4px 12px; background: #f0f2f5; border-radius: 20px; font-size: 12px; color: #6e7680; }

/* 筛选栏样式 */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  padding: 16px 24px;
  background: #fafbfc;
  border-bottom: 1px solid #e2e6ed;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-item label {
  font-size: 12px;
  font-weight: 500;
  color: #5a6270;
}
.filter-select, .filter-input {
  padding: 6px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  min-width: 140px;
}
.filter-input {
  min-width: 200px;
}
.filter-reset {
  padding: 6px 16px;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  color: #3b82f6;
  cursor: pointer;
  font-size: 13px;
  height: 34px;
  align-self: flex-end;
}
.filter-reset:hover {
  background: #eff6ff;
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid #f0f2f5;
  background: #fff;
}
.page-btn {
  padding: 6px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  font-size: 13px;
  color: #5a6270;
}
.page-jump {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.jump-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  text-align: center;
}

/* 表格样式 */
.table-wrapper {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table thead tr { background: #f8f9fc; border-bottom: 1px solid #e2e6ed; }
.data-table th { text-align: left; padding: 14px 16px; font-weight: 600; color: #5a6270; white-space: nowrap; }
.data-table td { padding: 14px 16px; border-bottom: 1px solid #f0f2f5; color: #2c3e50; }
.data-table tbody tr:hover { background: #fafbfd; }

.queue-name .name-highlight { font-weight: 600; color: #1f2329; }
.queue-desc { max-width: 280px; color: #8b92a0; font-size: 12px; }
.badge-running { display: inline-block; padding: 2px 10px; background: #e8f9ef; color: #2c7a44; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.status-active { background: #e8f9ef; color: #2c7a44; }
.status-open { background: #eef2ff; color: #3b82f6; }
.status-closed { background: #ffe8e6; color: #cb3a2b; }
.status-unknown { background: #f0f2f5; color: #8b92a0; }

.job-id { font-family: monospace; font-weight: 600; color: #3b82f6; }
.job-name { max-width: 280px; font-family: monospace; font-size: 12px; color: #5a6270; }
.queue-tag { display: inline-block; padding: 2px 8px; background: #eef2ff; color: #3b82f6; border-radius: 12px; font-size: 11px; font-weight: 500; }
.progress-cell { min-width: 100px; }
.progress-value { display: inline-block; font-size: 12px; font-weight: 500; margin-right: 8px; color: #2c3e50; }
.progress-bar { display: inline-block; width: 60px; height: 4px; background: #e2e6ed; border-radius: 2px; overflow: hidden; vertical-align: middle; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #2b9eff); border-radius: 2px; transition: width 0.3s; }
.empty-state { text-align: center; padding: 48px !important; color: #8b92a0; font-size: 14px; }

@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) {
  .job-monitor-container { padding: 16px; }
  .stats-grid { grid-template-columns: 1fr; }
  .card-header { padding: 14px 16px; }
  .data-table th, .data-table td { padding: 10px 12px; }
  .queue-desc, .job-name { max-width: 150px; }
  .progress-cell { min-width: 80px; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-select, .filter-input { width: 100%; }
  .filter-reset { align-self: stretch; }
}
@media (max-width: 480px) {
  .monitor-header { flex-direction: column; }
  .refresh-btn { align-self: flex-start; }
}
</style>