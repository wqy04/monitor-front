<template>
  <div class="alarm-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>告警中心</h1>
      <p class="subtitle">告警监控 · 智能分析 · 快速处置</p>
    </div>

    <!-- KPI 统计卡片（与工作台风格一致） -->
    <div class="kpi-card-wrapper">
      <KpiCard type="alert" label="总告警数" :value="totalAlerts" desc="历史累计告警" />
      <KpiCard type="alert" label="未解决告警" :value="unsolvedCount" desc="待处理告警" />
      <KpiCard type="alert" label="已解决告警" :value="solvedCount" desc="已完成处置" />
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar card-style">
      <div class="filter-row">
        <div class="filter-item">
          <label>告警级别</label>
          <select v-model="filters.level" class="filter-select" @change="resetPagination">
            <option value="">全部级别</option>
            <option value="3">严重</option>
            <option value="2">警告</option>
            <option value="1">提示</option>
          </select>
        </div>
        <div class="filter-item">
          <label>告警状态</label>
          <select v-model="filters.status" class="filter-select" @change="resetPagination">
            <option value="">全部状态</option>
            <option value="0">未解决</option>
            <option value="2">已解决</option>
          </select>
        </div>
        <div class="filter-item">
          <label>所属集群</label>
          <select v-model="filters.cluster" class="filter-select" @change="resetPagination">
            <option value="">全部集群</option>
            <option v-for="cluster in clusterOptions" :key="cluster" :value="cluster">
              {{ cluster }}
            </option>
          </select>
        </div>
        <div class="filter-item date-range">
          <label>起始日期</label>
          <input type="date" v-model="filters.startDate" class="date-input" @change="resetPagination" />
        </div>
        <div class="filter-item date-range">
          <label>结束日期</label>
          <input type="date" v-model="filters.endDate" class="date-input" @change="resetPagination" />
        </div>
        <div class="filter-actions">
          <button class="btn-reset" @click="resetFilters">重置筛选</button>
        </div>
      </div>
    </div>

    <!-- 告警列表表格卡片 -->
    <div class="chart-card">
      <div class="table-header">
        <h2>告警记录列表</h2>
        <span class="table-info">共 {{ filteredAlerts.length }} 条告警</span>
      </div>
      <div class="table-wrapper">
        <table class="alarm-table">
          <thead>
            <tr>
              <th>集群名称</th>
              <th>告警内容</th>
              <th>目标对象</th>
              <th>告警级别</th>
              <th>更新时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="loading-td">加载告警数据中...</td>
            </tr>
            <tr v-else-if="paginatedAlerts.length === 0">
              <td colspan="7" class="empty-td">暂无告警数据</td>
            </tr>
            <tr v-for="alert in paginatedAlerts" :key="alert.id">
              <td class="cluster-name">{{ alert.clusterName || '-' }}</td>
              <td class="notice">{{ alert.notice || '-' }}</td>
              <td>{{ alert.target || '-' }}</td>
              <td>
                <span :class="['level-tag', getLevelClass(alert.level)]">
                  {{ getLevelText(alert.level) }}
                </span>
              </td>
              <td>{{ formatDate(alert.updateTime) }}</td>
              <td>
                <span :class="['status-tag', alert.status === 2 ? 'resolved' : 'pending']">
                  {{ alert.status === 2 ? '已解决' : '未解决' }}
                </span>
              </td>
              <td class="action-btns">
                <button 
                  v-if="alert.status !== 2" 
                  class="btn-resolve" 
                  @click="handleResolve(alert)"
                  :disabled="loadingAction"
                >
                  标记已解决
                </button>
                <button 
                  v-else 
                  class="btn-resolved-disabled" 
                  disabled
                >
                  已解决
                </button>
                <button 
                  class="btn-delete" 
                  @click="handleDelete(alert)"
                  :disabled="loadingAction"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页组件 -->
      <div class="pagination" v-if="filteredAlerts.length > 0">
        <button class="page-btn" @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
        <span class="page-size-control">
          每页显示
          <select v-model="pageSize" @change="resetPagination">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
          条
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getAlertData, updateAlertStatus, deleteAlert } from '@/api/alert'
import { getClusterData } from '@/api/cluster'
import KpiCard from '../views/Dashboard/KpiCard.vue'   // 复用工作台KPI卡片组件

// ---------- 类型定义 ----------
interface AlertItem {
  id: number
  level: number          // 告警级别 1提示 2警告 3严重
  clusterName: string
  updateTime: string
  notice: string
  target: string
  status?: number        // 0-未解决 1-已解决，默认为0
  clusterId?: number
}

// ---------- 数据状态 ----------
const loading = ref(false)
const loadingAction = ref(false)
const alertsRaw = ref<AlertItem[]>([])      // 原始告警列表
const clusterOptions = ref<string[]>([])    // 集群名称列表用于筛选下拉

// 筛选条件
const filters = reactive({
  level: '',          // 告警级别: '' | '1' | '2' | '3'
  status: '',         // 状态: '' | '0' | '1'
  cluster: '',        // 集群名称
  startDate: '',      // 起始日期 YYYY-MM-DD
  endDate: ''         // 结束日期 YYYY-MM-DD
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// ---------- 辅助函数 ----------
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 16)
}

const getLevelText = (level: number) => {
  switch(level) {
    case 3: return '严重'
    case 2: return '警告'
    case 1: return '提示'
    default: return '未知'
  }
}

const getLevelClass = (level: number) => {
  switch(level) {
    case 3: return 'level-critical'
    case 2: return 'level-warning'
    case 1: return 'level-info'
    default: return ''
  }
}

// 重置分页到第一页
const resetPagination = () => {
  currentPage.value = 1
}

// ---------- 筛选计算属性 ----------
const filteredAlerts = computed(() => {
  let result = [...alertsRaw.value]

  // 1. 告警级别筛选
  if (filters.level !== '') {
    const levelNum = parseInt(filters.level)
    result = result.filter(alert => alert.level === levelNum)
  }

  // 2. 告警状态筛选，兼容旧数据无status字段默认未解决(0)
  if (filters.status !== '') {
    const targetStatus = parseInt(filters.status)
    result = result.filter(alert => (alert.status ?? 0) === targetStatus)
  }

  // 3. 集群筛选
  if (filters.cluster !== '') {
    result = result.filter(alert => alert.clusterName === filters.cluster)
  }

  // 4. 日期范围筛选（基于updateTime的日期部分）
  if (filters.startDate) {
    result = result.filter(alert => alert.updateTime >= filters.startDate + 'T00:00:00')
  }
  if (filters.endDate) {
    // 包含结束日期当天，将结束日期当天23:59:59作为边界
    const endDateTime = filters.endDate + 'T23:59:59'
    result = result.filter(alert => alert.updateTime <= endDateTime)
  }

  // 按更新时间倒序排列（最新的在前）
  result.sort((a, b) => b.updateTime.localeCompare(a.updateTime))
  return result
})

// 总页数
const totalPages = computed(() => Math.ceil(filteredAlerts.value.length / pageSize.value))

// 当前页展示数据
const paginatedAlerts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAlerts.value.slice(start, end)
})

// KPI统计数据
const totalAlerts = computed(() => alertsRaw.value.length)
const unsolvedCount = computed(() => alertsRaw.value.filter(a => (a.status ?? 0) === 0).length)
const solvedCount = computed(() => alertsRaw.value.filter(a => a.status === 2).length)

// 标记已解决操作
const handleResolve = async (alert: AlertItem) => {
  if (loadingAction.value) return
  const confirmed = confirm(`确认将告警「${alert.notice}」标记为已解决吗？`)
  if (!confirmed) return

  loadingAction.value = true
  try {
    await updateAlertStatus(alert.id, 2)
    // 更新本地状态: status 改为 1
    const target = alertsRaw.value.find(a => a.id === alert.id)
    if (target) target.status = 2
    // 如果当前筛选处于“未解决”状态，数据会消失，重置分页保证显示正确
    if (filters.status === '0') {
      resetPagination()
    }
  } catch (error) {
    console.error('标记已解决失败:', error)
  } finally {
    loadingAction.value = false
  }
}

// 删除告警操作
const handleDelete = async (alert: AlertItem) => {
  if (loadingAction.value) return
  const confirmed = confirm(`确认删除告警「${alert.notice}」吗？此操作不可恢复。`)
  if (!confirmed) return

  loadingAction.value = true
  try {
    await deleteAlert(alert.id)
    // 本地删除该条告警
    const index = alertsRaw.value.findIndex(a => a.id === alert.id)
    if (index !== -1) alertsRaw.value.splice(index, 1)
    // 如果当前页删除后没有数据且不是第一页，跳转到上一页
    if (paginatedAlerts.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (error) {
    console.error('删除告警失败:', error)
  } finally {
    loadingAction.value = false
  }
}

// 重置所有筛选条件
const resetFilters = () => {
  filters.level = ''
  filters.status = ''
  filters.cluster = ''
  filters.startDate = ''
  filters.endDate = ''
  resetPagination()
}

// 分页控制
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

// ---------- 数据加载 ----------
const fetchClustersAndAlerts = async () => {
  loading.value = true
  try {
    // 并发获取集群列表和告警列表 (保持与工作台风格一致)
    const [clusterRes, alertRes] = await Promise.all([getClusterData(), getAlertData()])
    console.log('集群数据:', clusterRes.data)
    // 解析集群名称用于过滤下拉
    const clusterData = clusterRes.data
    const clustersList = clusterData.clusters || []
    clusterOptions.value = clustersList.map((c: any) => c.clusterName).filter(Boolean)
    console.log('集群名称列表:', clusterOptions.value)
    // 解析告警列表: 依据工作台 alertRes.data.list
    let alertList: AlertItem[] = []
    if (alertRes.data && Array.isArray(alertRes.data.list)) {
      alertList = alertRes.data.list
    } else if (Array.isArray(alertRes.data)) {
      // 兼容直接返回数组的情况
      alertList = alertRes.data
    } else {
      alertList = []
    }
    
    // 对每条告警做数据规范化：status字段若不存在，默认为0 (未解决)
    alertsRaw.value = alertList.map(alert => ({
      ...alert,
      status: alert.status !== undefined ? alert.status : 0
    }))
    
    // 初始加载后重置分页和筛选条件（筛选保持默认空值）
    resetPagination()
  } catch (error) {
    console.error('获取告警数据失败:', error)
    alertsRaw.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchClustersAndAlerts()
})
</script>

<style scoped>
.alarm-container {
  width: 100%;
  padding: 20px 24px;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

.page-header {
  margin-bottom: 24px;
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1f2329;
    margin: 0 0 8px 0;
  }
  .subtitle {
    font-size: 14px;
    color: #6e7680;
    margin: 0;
  }
}

/* KPI卡片区域，复用工作台样式 */
.kpi-card-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
  margin-bottom: 32px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

/* 筛选栏卡片样式 */
.card-style {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.filter-bar {
  .filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 20px;
  }
  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    label {
      font-size: 13px;
      font-weight: 500;
      color: #4e5969;
    }
    .filter-select, .date-input {
      min-width: 130px;
      padding: 8px 12px;
      border: 1px solid #d0d5de;
      border-radius: 8px;
      background-color: #fff;
      font-size: 14px;
      color: #1f2329;
      transition: all 0.2s;
      &:focus {
        outline: none;
        border-color: #2d7aff;
        box-shadow: 0 0 0 2px rgba(45,122,255,0.1);
      }
    }
  }
  .filter-actions {
    display: flex;
    align-items: center;
    .btn-reset {
      background: #f2f3f5;
      border: 1px solid #e2e6ed;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      color: #1f2329;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        background: #e8eaef;
        border-color: #c9ced9;
      }
    }
  }
}

/* 表格卡片样式复用工作台 .chart-card */
.chart-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #1f2329;
  }
  .table-info {
    font-size: 13px;
    color: #6e7680;
  }
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 10px;
}

.alarm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th, td {
    padding: 14px 12px;
    text-align: left;
    border-bottom: 1px solid #eff2f6;
  }
  th {
    background-color: #fafbfc;
    font-weight: 600;
    color: #2c3e50;
    font-size: 13px;
  }
  tr:hover td {
    background-color: #f8f9fc;
  }
  .cluster-name {
    font-weight: 500;
    color: #1f2a3e;
  }
  .notice {
    max-width: 280px;
    word-break: break-word;
    color: #4a5568;
  }
  .loading-td, .empty-td {
    text-align: center;
    padding: 48px;
    color: #8f9bb3;
  }
}

/* 级别标签样式 */
.level-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}
.level-critical {
  background: #ffe9e9;
  color: #e54545;
}
.level-warning {
  background: #fff0db;
  color: #e67e22;
}
.level-info {
  background: #eaf3ff;
  color: #2d7aff;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
}
.status-tag.pending {
  background: #ffefdb;
  color: #e67e22;
}
.status-tag.resolved {
  background: #e3f7ec;
  color: #2ba55d;
}

/* 操作按钮 */
.action-btns {
  display: flex;
  gap: 10px;
  button {
    border: none;
    background: transparent;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  .btn-resolve {
    background: #eef3fe;
    color: #2d7aff;
    &:hover:not(:disabled) {
      background: #d9e8ff;
    }
  }
  .btn-resolved-disabled {
    background: #f0f1f3;
    color: #8f9bb3;
    cursor: default;
  }
  .btn-delete {
    background: #feecec;
    color: #e54545;
    &:hover:not(:disabled) {
      background: #fdd8d8;
    }
  }
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eff2f6;
  .page-btn {
    background: #fff;
    border: 1px solid #d0d5de;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: 0.2s;
    &:hover:not(:disabled) {
      background: #f5f7fa;
      border-color: #b9c0cc;
    }
    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }
  .page-info {
    font-size: 13px;
    color: #4e5969;
  }
  .page-size-control {
    font-size: 13px;
    color: #4e5969;
    select {
      margin: 0 4px;
      padding: 4px 6px;
      border-radius: 6px;
      border: 1px solid #d0d5de;
      background: #fff;
    }
  }
}

/* 响应式布局 */
@media (max-width: 1100px) {
  .filter-row {
    gap: 12px;
  }
  .filter-item .filter-select, .date-input {
    min-width: 110px;
  }
}
@media (max-width: 768px) {
  .kpi-card-wrapper {
    grid-template-columns: 1fr;
  }
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-actions {
    justify-content: flex-end;
  }
  .alarm-table th, .alarm-table td {
    padding: 10px 8px;
  }
  .notice {
    max-width: 180px;
  }
  .action-btns {
    flex-direction: column;
    gap: 6px;
  }
}
</style>