<template>
  <div class="profile-container">
    <!-- 页面标题区（仿工作台样式） -->
    <div class="profile-header">
      <h1>个人中心</h1>
      <p class="subtitle">查看并管理您的账户信息与安全设置</p>
    </div>

    <!-- 两栏内容区（左侧个人信息 + 右侧安全与统计） -->
    <div class="profile-content">
      <!-- 左侧：个人信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <h2>个人信息</h2>
          <button class="edit-btn" @click="openEditDialog">编辑资料</button>
        </div>
        
        <div class="user-avatar-section">
          <div class="avatar-circle">{{ userAvatarInitial }}</div>
          <div class="avatar-info">
            <div class="username">{{ user.username }}</div>
            <div class="user-role-badge" :class="roleClass">{{ roleText }}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">用户ID</span>
            <span class="info-value">{{ user.userId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">所属学院</span>
            <span class="info-value">{{ user.department || '未填写' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">账号状态</span>
            <span class="info-value status-badge" :class="statusClass">{{ statusText }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后登录</span>
            <span class="info-value">{{ formatDate(user.lastLogin) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatDate(user.createTime) }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：待处理告警 + 安全与统计卡片 -->
      <div class="right-column">
        <!-- 待处理告警卡片（复用工作台告警组件，保持样式一致） -->
        <div class="alert-card-wrapper">
          <RecentAlertsList :alerts="recentAlerts" :total="unsolvedAlertTotal" />
        </div>

        <!-- 安全设置卡片 -->
        <div class="security-card">
          <div class="card-header">
            <h2>安全设置</h2>
            <button class="edit-btn" @click="openPasswordDialog">修改密码</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <div v-if="editDialogVisible" class="modal-overlay" @click.self="closeEditDialog">
      <div class="modal-container">
        <div class="modal-header">
          <h3>编辑资料</h3>
          <button class="modal-close" @click="closeEditDialog">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>用户名</label>
            <input type="text" v-model="editForm.username" placeholder="请输入用户名" />
          </div>
          <div class="form-item">
            <label>所属学院</label>
            <input type="text" v-model="editForm.department" placeholder="请输入所属学院" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEditDialog">取消</button>
          <button class="btn-confirm" @click="saveProfile">保存修改</button>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <div v-if="passwordDialogVisible" class="modal-overlay" @click.self="closePasswordDialog">
      <div class="modal-container">
        <div class="modal-header">
          <h3>修改密码</h3>
          <button class="modal-close" @click="closePasswordDialog">×</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>新密码</label>
            <input type="password" v-model="passwordForm.newPassword" placeholder="请输入新密码（至少6位）" />
          </div>
          <div class="form-item">
            <label>确认新密码</label>
            <input type="password" v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closePasswordDialog">取消</button>
          <button class="btn-confirm" @click="savePassword">确认修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { getUserInfo, updateUserInfo } from '@/api/user'
import { getAlertData } from '@/api/alert'
import { resetPassword } from '@/api/login'
import RecentAlertsList from '@/pages/home/views/Dashboard/RecentAlertsList.vue'

const userStore = useUserStore()
const router = useRouter()
const userInfo = userStore.userInfo

// 用户信息
const user = ref({
  userId: null,
  username: '',
  department: '',
  userRole: null,
  status: '',
  lastLogin: '',
  createTime: ''
})

// 告警相关数据
interface AlertItem {
  id: number
  notice: string
  target: string
  level: number
  updateTime: string
  clusterName: string
}
const alertList = ref<AlertItem[]>([])
const recentAlerts = ref<AlertItem[]>([])   // 仅展示前5条
const unsolvedAlertTotal = ref<number>(0)

// 右侧统计数据（模拟，可根据实际需求对接API）
const stats = ref({
  totalJobs: 42,
  runningJobs: 3,
  pendingJobs: 1,
  storageUsed: 187,
  activeDays: 18
})

// ========== 弹窗相关状态 ==========
// 编辑资料弹窗
const editDialogVisible = ref(false)
const editForm = reactive({
  username: '',
  department: ''
})

// 修改密码弹窗
const passwordDialogVisible = ref(false)
const passwordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

// 模拟当前正确的密码（假数据演示用）
const mockCurrentPassword = '123456'

// 获取用户信息和告警数据
const fetchUserData = async () => {
  if (!userInfo?.userId) {
    console.warn('用户ID不存在，使用默认演示数据')
    return
  }
  try {
    const res = await getUserInfo(userInfo.userId)
    user.value = res.data
    console.log('用户信息加载成功:', user.value)
  } catch (error) {
    console.warn('获取用户信息失败，使用默认演示数据', error)
  }
}

const fetchAlertData = async () => {
  try {
    const alertRes = await getAlertData()
    const allAlerts = alertRes.data.list || []
    alertList.value = allAlerts
    unsolvedAlertTotal.value = allAlerts.length
    // 仅展示最近5条待处理告警
    recentAlerts.value = allAlerts.slice(0, 5)
    console.log('告警数据加载成功，共', unsolvedAlertTotal.value, '条')
  } catch (error) {
    console.error('获取告警数据失败：', error)
    // 使用空数据
    alertList.value = []
    recentAlerts.value = []
    unsolvedAlertTotal.value = 0
  }
}

onMounted(() => {
  fetchUserData()
  fetchAlertData()
})

// 头像首字母大写
const userAvatarInitial = computed(() => {
  return user.value.username?.charAt(0).toUpperCase() || 'U'
})

// 角色文本与样式
const roleText = computed(() => {
  return user.value.userRole === 0 ? '系统管理员' : '普通用户'
})
const roleClass = computed(() => {
  return user.value.userRole === 0 ? 'admin-role' : 'user-role'
})

// 账号状态文字及样式
const statusText = computed(() => {
  return user.value.status === 'active' ? '激活' : '未激活'
})
const statusClass = computed(() => {
  return user.value.status === 'active' ? 'status-active' : 'status-inactive'
})

// 辅助方法：格式化日期时间
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '--'
  return dateStr.replace('T', ' ').substring(0, 19)
}

// ========== 编辑资料相关方法 ==========
const openEditDialog = () => {
  // 打开弹窗前，用当前用户信息填充表单
  editForm.username = user.value.username || ''
  editForm.department = user.value.department || ''
  editDialogVisible.value = true
}

const closeEditDialog = () => {
  editDialogVisible.value = false
}

const saveProfile = () => {
  // 简单的表单校验
  if (!editForm.username.trim()) {
    alert('用户名不能为空')
    return
  }
  if (!editForm.department.trim()) {
    alert('所属学院不能为空')
    return
  }

  // 模拟异步保存（假数据）
  // 更新页面显示的用户信息
  // user.value.username = editForm.username.trim()
  // user.value.department = editForm.department.trim()
  console.log('准备更新用户信息：', {
    userId: user.value.userId,
    username: editForm.username.trim(),
    department: editForm.department.trim()
  })
  updateUserInfo({
    userId: user.value.userId || 0,  // 确保有一个默认值，实际开发中应该有用户ID
    username: editForm.username.trim(),
    department: editForm.department.trim()
  }).then(() => {
    // 更新成功后刷新用户信息
    fetchUserData()
    alert('资料修改成功！')
    closeEditDialog()
  }).catch(error => {
    console.error('更新用户信息失败：', error)
    alert('保存失败，请稍后再试')
  })
}

// ========== 修改密码相关方法 ==========
const openPasswordDialog = () => {
  // 清空表单
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

const closePasswordDialog = () => {
  passwordDialogVisible.value = false
}

const savePassword = () => {
  // 获取表单值
  const newPwd = passwordForm.newPassword
  const confirmPwd = passwordForm.confirmPassword

  // 2. 验证新密码长度
  if (!newPwd || newPwd.length < 6) {
    alert('新密码长度至少为6位')
    return
  }

  // 3. 验证新密码与确认密码是否一致
  if (newPwd !== confirmPwd) {
    alert('两次输入的新密码不一致，请重新输入')
    return
  }

  // 实际开发中这里会调用修改密码的API
  resetPassword(user.value.username, passwordForm.confirmPassword).then((response) => {
    console.log('重置密码成功:', response)
    // 清理本地认证信息并跳回登录页
    userStore.clearAuth()
    closePasswordDialog()
    router.push('/login')
  }).catch((error) => {
    console.error('重置密码失败:', error)
    alert('密码修改失败，请稍后再试')
  })
}

</script>

<style scoped>
/* 主容器样式，仿工作台 dashboard-container 风格 */
.profile-container {
  width: 100%;
  padding: 20px 24px;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

/* 页面头部 */
.profile-header {
  margin-bottom: 24px;
}
.profile-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
  margin: 0 0 8px 0;
}
.profile-header .subtitle {
  font-size: 14px;
  color: #6e7680;
  margin: 0;
}

/* 两栏布局 */
.profile-content {
  display: flex;
  gap: 20px;
  align-items: stretch;
  flex-wrap: wrap;
}

/* 左侧个人信息卡片 */
.info-card {
  flex: 1.2;
  min-width: 280px;
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  transition: box-shadow 0.2s;
}

.right-column {
  flex: 2;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 通用卡片样式（右侧多个卡片） */
.security-card,
.stats-card,
.alert-card-wrapper {
  background: #fff;
  border: 1px solid #e2e6ed;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

/* 卡片头部公用 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
}
.edit-btn {
  background: none;
  border: 1px solid #d0d5dd;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s;
}
.edit-btn:hover {
  background-color: #eff6ff;
  border-color: #3b82f6;
}

/* 用户头像区域 */
.user-avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 20px;
  margin-bottom: 20px;
}
.avatar-circle {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #1e6fff, #2b9eff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 500;
  color: white;
  box-shadow: 0 2px 8px rgba(30,111,255,0.2);
}
.avatar-info .username {
  font-size: 20px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 6px;
}
.user-role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
  background-color: #f0f2f5;
  color: #2c3e50;
}
.user-role-badge.admin-role {
  background: #eef2ff;
  color: #3b82f6;
}
.user-role-badge.user-role {
  background: #e8f3ed;
  color: #2b7e3a;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
}
.info-label {
  font-size: 12px;
  color: #8b92a0;
  margin-bottom: 6px;
}
.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  word-break: break-word;
}
.status-badge {
  display: inline-block;
  width: fit-content;
  padding: 2px 10px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
}
.status-active {
  background: #e8f9ef;
  color: #2c7a44;
}
.status-inactive {
  background: #ffe8e6;
  color: #cb3a2b;
}

/* 使用统计卡片内部样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  text-align: center;
}
.stat-item {
  padding: 8px;
}
.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #1f2329;
  line-height: 1.2;
}
.stat-unit {
  font-size: 14px;
  font-weight: normal;
  margin-left: 2px;
}
.stat-label {
  font-size: 12px;
  color: #8b92a0;
  margin-top: 6px;
}

/* ========== 弹窗样式 ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #eef2f6;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 26px;
  line-height: 1;
  color: #8b92a0;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}
.modal-close:hover {
  background-color: #f0f2f5;
  color: #1f2329;
}

.modal-body {
  padding: 24px;
}

.form-item {
  margin-bottom: 20px;
}
.form-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1f2329;
  margin-bottom: 8px;
}
.form-item input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 14px;
  transition: border 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.form-item input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eef2f6;
}
.btn-cancel,
.btn-confirm {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.btn-cancel {
  background: #fff;
  border: 1px solid #d0d5dd;
  color: #6e7680;
}
.btn-cancel:hover {
  background-color: #f8f9fc;
  border-color: #b9c0cc;
}
.btn-confirm {
  background: #3b82f6;
  color: white;
}
.btn-confirm:hover {
  background: #2563eb;
}

/* 响应式布局，同工作台 */
@media (max-width: 1000px) {
  .profile-content {
    flex-direction: column;
  }
  .info-card, .right-column {
    flex: auto;
  }
}
@media (max-width: 768px) {
  .profile-container {
    padding: 16px;
  }
  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .modal-container {
    width: 95%;
    margin: 16px;
  }
}
</style>