<template>
  <div class="user-monitor-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>用户监控</h1>
      <p class="subtitle">用户列表 · 资源配额 · 实时负载</p>
    </div>

    <!-- KPI 统计卡片（与工作台风格一致） -->
    <div class="kpi-card-wrapper">
      <div class="stat-card">
        <div class="stat-label">总用户数</div>
        <div class="stat-value">{{ totalUsers }}</div>
        <div class="stat-desc">平台注册用户</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">活跃用户</div>
        <div class="stat-value">{{ activeUsers }}</div>
        <div class="stat-desc">运行作业中</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总运行作业</div>
        <div class="stat-value">{{ totalRunningJobs }}</div>
        <div class="stat-desc">实时累计</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar card-style">
      <div class="filter-row">
        <div class="filter-item search-item">
          <label>用户名</label>
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="请输入用户名搜索"
            class="search-input"
            @input="resetPagination"
          />
        </div>
        <div class="filter-actions">
          <button class="btn-reset" @click="resetSearch">重置筛选</button>
          <button class="btn-refresh" @click="fetchUserData" :disabled="loading">
            <span class="refresh-icon">↻</span> 刷新
          </button>
        </div>
      </div>
    </div>

    <!-- 用户列表表格卡片 -->
    <div class="chart-card">
      <div class="table-header">
        <h2>用户列表</h2>
        <span class="table-info">共 {{ filteredUsers.length }} 名用户</span>
      </div>
      <div class="table-wrapper">
        <table class="user-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>最大槽位</th>
              <th>运行中作业</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="loading-td">加载用户数据中...</td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="4" class="empty-td">暂无用户数据</td>
            </tr>
            <tr v-for="user in paginatedUsers" :key="user.user">
              <td class="username">
                <span class="username-text">{{ user.user }}</span>
              </td>
              <td class="max-slots">
                <span :class="['slot-badge', user.maxSlots === 0 ? 'unlimited' : 'limited']">
                  {{ user.maxSlots === 0 ? '无限制' : user.maxSlots }}
                </span>
              </td>
              <td class="running-jobs">
                <span :class="['job-badge', user.runningJobs > 0 ? 'active' : 'idle']">
                  {{ user.runningJobs }}
                </span>
              </td>
              <td class="user-status">
                <span :class="['status-tag', user.runningJobs > 0 ? 'active-status' : 'idle-status']">
                  {{ user.runningJobs > 0 ? '运行中' : '空闲' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页组件 -->
      <div class="pagination" v-if="filteredUsers.length > 0">
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
import { prometheusUserData } from '@/api/user'

// ---------- 类型定义 ----------
interface UserItem {
  user: string
  maxSlots: number
  runningJobs: number
}

// ---------- 数据状态 ----------
const loading = ref(false)
const userList = ref<UserItem[]>([])      // 原始用户列表

// 筛选条件
const searchKeyword = ref('')            // 用户名搜索关键词

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// ---------- 统计计算属性（基于原始数据，不随筛选变化）----------
const totalUsers = computed(() => userList.value.length)
const activeUsers = computed(() => userList.value.filter(u => u.runningJobs > 0).length)
const totalRunningJobs = computed(() => userList.value.reduce((sum, u) => sum + u.runningJobs, 0))

// ---------- 筛选计算属性（前端模糊搜索）----------
const filteredUsers = computed(() => {
  let result = [...userList.value]
  
  // 按用户名模糊搜索（不区分大小写）
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    result = result.filter(user => user.user.toLowerCase().includes(keyword))
  }
  
  // 按用户名排序（字母顺序）
  result.sort((a, b) => a.user.localeCompare(b.user))
  return result
})

// 总页数
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize.value))

// 当前页展示数据
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

// ---------- 辅助函数 ----------
// 重置分页到第一页
const resetPagination = () => {
  currentPage.value = 1
}

// 重置搜索条件
const resetSearch = () => {
  searchKeyword.value = ''
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
const fetchUserData = async () => {
  loading.value = true
  try {
    const response = await prometheusUserData()
    console.log('Prometheus User Data:', response.data)
    
    // 适配数据结构：response.data.users 为数组
    if (response.data && Array.isArray(response.data.users)) {
      userList.value = response.data.users.map((item: any) => ({
        user: item.user || '',
        maxSlots: item.maxSlots ?? 0,
        runningJobs: item.runningJobs ?? 0
      }))
    } else if (Array.isArray(response.data)) {
      // 兼容直接返回数组的情况
      userList.value = response.data.map((item: any) => ({
        user: item.user || '',
        maxSlots: item.maxSlots ?? 0,
        runningJobs: item.runningJobs ?? 0
      }))
    } else {
      userList.value = []
      console.warn('用户数据格式异常:', response.data)
    }
    
    // 数据加载完成后重置分页
    resetPagination()
  } catch (error) {
    console.error('获取用户数据失败:', error)
    userList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUserData()
})
</script>

<style scoped>
.user-monitor-container {
  width: 100%;
  padding: 20px 24px;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

.page-header {
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
  margin: 0 0 8px 0;
}
.page-header .subtitle {
  font-size: 14px;
  color: #6e7680;
  margin: 0;
}

/* KPI 卡片区域（自实现，风格与工作台一致） */
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
.stat-card {
  text-align: center;
  padding: 8px 0;
}
.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: #6e7680;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 8px;
  line-height: 1.2;
}
.stat-desc {
  font-size: 12px;
  color: #8f9bb3;
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
.filter-bar .filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 20px;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-item label {
  font-size: 13px;
  font-weight: 500;
  color: #4e5969;
}
.search-input {
  min-width: 220px;
  padding: 8px 12px;
  border: 1px solid #d0d5de;
  border-radius: 8px;
  background-color: #fff;
  font-size: 14px;
  color: #1f2329;
  transition: all 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: #2d7aff;
  box-shadow: 0 0 0 2px rgba(45,122,255,0.1);
}
.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.btn-reset, .btn-refresh {
  background: #f2f3f5;
  border: 1px solid #e2e6ed;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: #1f2329;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-reset:hover, .btn-refresh:hover:not(:disabled) {
  background: #e8eaef;
  border-color: #c9ced9;
}
.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.refresh-icon {
  display: inline-block;
  font-size: 14px;
  transition: transform 0.3s ease;
}
.btn-refresh:active:not(:disabled) .refresh-icon {
  transform: rotate(180deg);
}

/* 表格卡片样式 */
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
}
.table-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1f2329;
}
.table-info {
  font-size: 13px;
  color: #6e7680;
}
.table-wrapper {
  overflow-x: auto;
  border-radius: 10px;
}
.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.user-table th,
.user-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid #eff2f6;
}
.user-table th {
  background-color: #fafbfc;
  font-weight: 600;
  color: #2c3e50;
  font-size: 13px;
}
.user-table tr:hover td {
  background-color: #f8f9fc;
}
.username {
  font-weight: 500;
  color: #1f2a3e;
}
.username-text {
  display: inline-block;
  max-width: 200px;
  word-break: break-all;
}
.max-slots .slot-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
  background: #eef3fe;
  color: #2d7aff;
}
.max-slots .slot-badge.unlimited {
  background: #f0f1f3;
  color: #6e7680;
}
.running-jobs .job-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
  background: #f0f1f3;
  color: #4e5969;
}
.running-jobs .job-badge.active {
  background: #ffefdb;
  color: #e67e22;
  font-weight: 600;
}
.user-status .status-tag {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
}
.user-status .active-status {
  background: #e3f7ec;
  color: #2ba55d;
}
.user-status .idle-status {
  background: #f2f3f5;
  color: #8f9bb3;
}
.loading-td,
.empty-td {
  text-align: center;
  padding: 48px;
  color: #8f9bb3;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eff2f6;
}
.page-btn {
  background: #fff;
  border: 1px solid #d0d5de;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: #f5f7fa;
  border-color: #b9c0cc;
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.page-info {
  font-size: 13px;
  color: #4e5969;
}
.page-size-control {
  font-size: 13px;
  color: #4e5969;
}
.page-size-control select {
  margin: 0 4px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid #d0d5de;
  background: #fff;
}

/* 响应式布局 */
@media (max-width: 1100px) {
  .filter-row {
    gap: 12px;
  }
  .search-input {
    min-width: 180px;
  }
}
@media (max-width: 768px) {
  .kpi-card-wrapper {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-actions {
    justify-content: flex-end;
  }
  .user-table th,
  .user-table td {
    padding: 10px 8px;
  }
  .username-text {
    max-width: 120px;
  }
}
</style>