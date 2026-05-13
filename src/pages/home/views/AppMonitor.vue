<template>
  <div class="app-monitor-container">
    <!-- 页面标题区 -->
    <div class="monitor-header">
      <div class="header-left">
        <h1>应用监控</h1>
        <p class="subtitle">查看所有应用及其作业运行状态</p>
      </div>
      <!-- <button class="refresh-btn" @click="fetchAppData" :disabled="loading">
        <span class="refresh-icon">↻</span> {{ loading ? '刷新中...' : '刷新数据' }}
      </button> -->
    </div>

    <!-- 统计卡片区 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-number">{{ totalApps }}</div>
        <div class="stat-label">应用总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number running">{{ totalRunning }}</div>
        <div class="stat-label">运行中作业</div>
      </div>
      <div class="stat-card">
        <div class="stat-number pending">{{ totalPending }}</div>
        <div class="stat-label">待处理作业</div>
      </div>
      <div class="stat-card">
        <div class="stat-number suspended">{{ totalSuspended }}</div>
        <div class="stat-label">挂起作业</div>
      </div>
    </div>

    <!-- 应用列表卡片 -->
    <div class="apps-card">
      <div class="card-header">
        <h2>应用详情列表</h2>
        <div class="header-actions">
          <div class="search-box">
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="按应用名称搜索..."
              class="search-input"
              @input="resetPagination"
            />
            <span class="search-icon">🔍</span>
          </div>
          <span class="apps-count">共 {{ filteredApps.length }} 个应用</span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载应用中...</span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
        <button class="retry-btn" @click="fetchAppData">重试</button>
      </div>

      <!-- 应用表格 -->
      <div v-else class="table-wrapper">
        <table class="apps-table">
          <thead>
            <tr>
              <th>应用ID</th>
              <th>应用名称</th>
              <th>描述</th>
              <th class="job-count-cell">待处理</th>
              <th class="job-count-cell">运行中</th>
              <th class="job-count-cell">挂起</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginatedApps.length === 0">
              <td colspan="6" class="empty-td">未找到匹配的应用</td>
            </tr>
            <tr v-for="app in paginatedApps" :key="app.appId">
              <td class="app-id">{{ app.appId }}</td>
              <td class="app-name">
                <span class="app-name-initial">{{ getAppInitial(app.appName) }}</span>
                <span class="app-name-text">{{ app.appName }}</span>
              </td>
              <td class="app-description">
                <span :class="{ 'no-description': app.description === 'No description provided' }">
                  {{ truncateDescription(app.description) }}
                </span>
              </td>
              <td class="job-count pending-count">
                <span class="job-badge pending">{{ app.jobsPending }}</span>
              </td>
              <td class="job-count running-count">
                <span class="job-badge running">{{ app.jobsRunning }}</span>
              </td>
              <td class="job-count suspended-count">
                <span class="job-badge suspended">{{ app.jobsSuspended }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页组件 -->
      <div class="pagination" v-if="filteredApps.length > 0">
        <button class="page-btn" @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
        <span class="page-size-control">
          每页显示
          <select v-model="pageSize" @change="resetPagination">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          条
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAppData } from '@/api/apps';

// 应用数据结构
interface AppItem {
  appId: number;
  appName: string;
  description: string;
  clusterId: number;
  jobsPending: number;
  jobsRunning: number;
  jobsSuspended: number;
}

// 响应式数据
const apps = ref<AppItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchKeyword = ref('');      // 搜索关键词
const currentPage = ref(1);
const pageSize = ref(10);

// 获取应用数据
const fetchAppData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await getAppData();
    const data = response.data;
    console.log('获取应用数据成功:', data);
    if (Array.isArray(data)) {
      apps.value = data;
    } else {
      console.warn('返回数据格式不正确，期望数组', data);
      apps.value = [];
    }
  } catch (err: any) {
    console.error('获取应用数据失败:', err);
    error.value = err.message || '加载应用数据失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

// 重置分页（搜索或改变每页条数时调用）
const resetPagination = () => {
  currentPage.value = 1;
};

// 切换上一页 / 下一页
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

// 根据搜索关键词过滤应用（按应用名称模糊匹配，不区分大小写）
const filteredApps = computed(() => {
  if (!searchKeyword.value.trim()) {
    return apps.value;
  }
  const keyword = searchKeyword.value.trim().toLowerCase();
  return apps.value.filter(app => app.appName.toLowerCase().includes(keyword));
});

// 总页数
const totalPages = computed(() => Math.ceil(filteredApps.value.length / pageSize.value));

// 当前页显示的数据
const paginatedApps = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredApps.value.slice(start, end);
});

// 统计卡片数据（基于原始全部应用）
const totalApps = computed(() => apps.value.length);
const totalRunning = computed(() => apps.value.reduce((sum, app) => sum + (app.jobsRunning || 0), 0));
const totalPending = computed(() => apps.value.reduce((sum, app) => sum + (app.jobsPending || 0), 0));
const totalSuspended = computed(() => apps.value.reduce((sum, app) => sum + (app.jobsSuspended || 0), 0));

// 辅助函数：获取应用名称首字母
const getAppInitial = (name: string) => {
  if (!name) return 'A';
  return name.charAt(0).toUpperCase();
};

// 辅助函数：截断描述文本
const truncateDescription = (desc: string, maxLen: number = 40) => {
  if (!desc) return '无描述';
  if (desc === 'No description provided') return '无描述';
  if (desc.length <= maxLen) return desc;
  return desc.substring(0, maxLen) + '...';
};

// 页面初始化
onMounted(() => {
  fetchAppData();
});
</script>

<style scoped>
/* 主容器样式 */
.app-monitor-container {
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
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.header-left h1 {
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
.refresh-btn {
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
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
  display: inline-block;
  font-size: 16px;
  transition: transform 0.3s;
}
.refresh-btn:active:not(:disabled) .refresh-icon {
  transform: rotate(180deg);
}

/* 统计卡片区域 */
.stats-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1;
  min-width: 140px;
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  transition: box-shadow 0.2s;
}
.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: #1f2329;
  line-height: 1.2;
  margin-bottom: 8px;
}
.stat-number.running {
  color: #2b7e3a;
}
.stat-number.pending {
  color: #e68a2e;
}
.stat-number.suspended {
  color: #cb3a2b;
}
.stat-label {
  font-size: 14px;
  color: #6e7680;
  font-weight: 500;
}

/* 应用列表卡片 */
.apps-card {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.search-box {
  position: relative;
}
.search-input {
  padding: 8px 32px 8px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 20px;
  font-size: 13px;
  width: 220px;
  outline: none;
  transition: all 0.2s;
}
.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
}
.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #9aa3b0;
  pointer-events: none;
}
.apps-count {
  font-size: 13px;
  color: #8b92a0;
  background: #f0f2f5;
  padding: 4px 10px;
  border-radius: 30px;
}

/* 表格容器 */
.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
}

/* 表格样式 —— 修复列不固定问题 */
.apps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 680px;
  table-layout: fixed; /* 关键：固定列宽 */
}
.apps-table th,
.apps-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid #eff2f6;
  word-wrap: break-word; /* 自动换行 */
  overflow: hidden;
}
.apps-table th {
  background-color: #fafbfc;
  font-weight: 600;
  color: #2c3e50;
  font-size: 13px;
  letter-spacing: 0.3px;
}
.apps-table tr:hover td {
  background-color: #f8f9fc;
}

/* 给每列固定宽度 */
.apps-table th:nth-child(1),
.apps-table td:nth-child(1) { width: 100px; } /* 应用ID */
.apps-table th:nth-child(2),
.apps-table td:nth-child(2) { width: 180px; } /* 应用名称 */
.apps-table th:nth-child(3),
.apps-table td:nth-child(3) { width: 280px; } /* 描述 */
.apps-table th:nth-child(4),
.apps-table td:nth-child(4),
.apps-table th:nth-child(5),
.apps-table td:nth-child(5),
.apps-table th:nth-child(6),
.apps-table td:nth-child(6) { width: 100px; } /* 3个状态列 */

.apps-table .job-count-cell {
  text-align: center;
}
.job-count {
  text-align: center;
}
.empty-td {
  text-align: center;
  padding: 48px !important;
  color: #8f9bb3;
}

/* 应用名称样式 */
.app-name {
  display: flex;
  align-items: center;
  gap: 10px;
}
.app-name-initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1e6fff, #2b9eff);
  color: white;
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.app-name-text {
  font-weight: 500;
  color: #1f2329;
  word-break: break-word;
}

/* 描述文本 */
.app-description {
  color: #5b6573;
  font-size: 13px;
  line-height: 1.4;
}
.no-description {
  color: #a0a8b4;
  font-style: italic;
}

/* 作业计数徽章样式 */
.job-badge {
  display: inline-block;
  min-width: 36px;
  padding: 4px 8px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  background-color: #f0f2f5;
  color: #2c3e50;
}
.job-badge.pending {
  background: #fff3e8;
  color: #e68a2e;
}
.job-badge.running {
  background: #e8f5ed;
  color: #2b7e3a;
}
.job-badge.suspended {
  background: #feeceb;
  color: #cb3a2b;
}

/* 加载/错误状态 */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  color: #6e7680;
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e6ed;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-state .error-icon {
  font-size: 32px;
}
.retry-btn {
  margin-top: 8px;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 20px;
  padding: 6px 18px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.retry-btn:hover {
  background-color: #f0f2f5;
  border-color: #b9c0cc;
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
@media (max-width: 900px) {
  .app-monitor-container {
    padding: 16px;
  }
  .stats-overview {
    gap: 12px;
  }
  .stat-card {
    min-width: 120px;
    padding: 16px 12px;
  }
  .stat-number {
    font-size: 28px;
  }
  .apps-card {
    padding: 16px;
  }
  .app-name-initial {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  .job-badge {
    min-width: 32px;
    padding: 3px 6px;
    font-size: 12px;
  }
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  .search-input {
    width: 180px;
  }
}
@media (max-width: 640px) {
  .monitor-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .pagination {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>