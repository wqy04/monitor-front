<template>
  <div class="login-container">
    <!-- 登录背景图 -->
    <div class="school-logo">
      <img src="/public/images/schoolLogo.png" alt="学校Logo"/>
      <p class="login-title">集群监控系统统一登录</p>
    </div>
    <div>
      <!-- 登录表单 -->
      <img src="/public/images/loginBackground.png" alt="登录背景" class="login-background" />
      <div class="login-form">
        <h2 class="login-form-title">集群监控系统{{isRegister ? '注册' : '登录'}}</h2>
        <div style="color:red; margin-bottom:10px; text-align: center;">{{ errMsg }}</div>
        <div class="login-form-content">
          <div class="form-item">
            <label 
              for="username" 
              :class="{ error: errorFields.username }"
            >用户名:</label>
            <n-input
              v-model:value="username"
              type="text"
              placeholder="请输入用户名"
              :class="{ shake: errorFields.username, 'input-error': errorFields.username }"
            />
          </div>
          <div class="form-item">
            <label 
              for="password" 
              :class="{ error: errorFields.password }"
            >密码:</label>
            <n-input
              v-model:value="password"
              type="password"
              placeholder="请输入密码"
              :class="{ shake: errorFields.password, 'input-error': errorFields.password }"
            />
          </div>
          <div class="form-item" v-if="isRegister">
            <label 
              for="confirmPassword" 
              :class="{ error: errorFields.confirmPassword }"
            >确认密码:</label>
            <n-input
              v-model:value="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              :class="{ shake: errorFields.confirmPassword, 'input-error': errorFields.confirmPassword }"
            />
          </div>
          <div class="form-item" v-if="!isForgetPassword && isRegister">
            <label for="department">所属学院:</label>
            <n-select v-model:value="department" :options="options" />
          </div>
        </div>
        <div class="login-button">
            <n-button color="#0053a4" block @click="handleLogin" v-if="!isRegister">
                登录
            </n-button>
            <n-button 
              :color="isRegister ? '#0053a4' : '#ffffff'" 
              block
              @click="isRegister ? handleRegister() : (isRegister = true,resetErrors(),username='',password='',confirmPassword='',department='')"
            >
                <p :style="{ color: isRegister ? 'white' : 'black' }">
                    {{isForgetPassword ? '重置密码' : isRegister ? '确认' : '注册' }}
                </p>
            </n-button>
        </div>
        <div class="forget-password" v-if="!isRegister" @click="forgotPassword()">
            忘记密码？
        </div>
        <div class="forget-password" v-if="isRegister" @click="isRegister = false,isForgetPassword = false,resetErrors(),username='',password='',confirmPassword='',department=''">
            返回登录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NSelect } from 'naive-ui'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { login, register, resetPassword } from '@/api/login'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const isRegister = ref(false)
const isForgetPassword = ref(false)
const department = ref('')// 学院选择
const errMsg = ref('') // 错误信息

// 错误状态管理：控制文字、边框、抖动
const errorFields = reactive({
  username: false,
  password: false,
  confirmPassword: false
})

const options = [
  { label: '航空学院', value: '航空学院' },
  { label: '航天学院', value: '航天学院' },
  { label: '航海学院', value: '航海学院' },
  { label: '材料学院', value: '材料学院' },
  { label: '机电学院', value: '机电学院' },
  { label: '力学与土木建筑学院', value: '力学与土木建筑学院' },
  { label: '力学与交通运载工程学院', value: '力学与交通运载工程学院' },
  { label: '动力与能源学院', value: '动力与能源学院' },
  { label: '电子信息学院', value: '电子信息学院' },
  { label: '自动化学院', value: '自动化学院' },
  { label: '计算机学院', value: '计算机学院' },
  { label: '数学与统计学院', value: '数学与统计学院' },
  { label: '物理科学与技术学院', value: '物理科学与技术学院' },
  { label: '化学与化工学院', value: '化学与化工学院' },
  { label: '管理学院', value: '管理学院' },
  { label: '公共政策与管理学院', value: '公共政策与管理学院' },
  { label: '软件学院', value: '软件学院' },
  { label: '外国语学院', value: '外国语学院' },
  { label: '马克思主义学院', value: '马克思主义学院' },
  { label: '微电子学院', value: '微电子学院' },
  { label: '网络空间安全学院/国家保密学院', value: '网络空间安全学院/国家保密学院' },
  { label: '民航学院', value: '民航学院' },
  { label: '生命学院', value: '生命学院' },
  { label: '生态环境学院', value: '生态环境学院' },
  { label: '医学研究院', value: '医学研究院' },
  { label: '无人系统技术研究院/无人系统发展战略研究中心', value: '无人系统技术研究院/无人系统发展战略研究中心' },
  { label: '文化遗产研究院', value: '文化遗产研究院' },
  { label: '柔性电子研究院', value: '柔性电子研究院' },
  { label: '光电与智能研究院', value: '光电与智能研究院' },
  { label: '海洋研究院', value: '海洋研究院' },
  { label: '高等教育研究中心', value: '高等教育研究中心' },
  { label: '长三角研究院', value: '长三角研究院' },
]

// 重置所有错误状态
const resetErrors = () => {
  errorFields.username = false
  errorFields.password = false
  errorFields.confirmPassword = false
  errMsg.value = ''
}

const handleLogin = () => {
  resetErrors()
  login(username.value, password.value).then((response) => {
    // 登录成功，保存 accessToken 和 userInfo 到 Pinia
    const { accessToken, refreshToken, user } = response.data
    
    userStore.setToken(accessToken)
    userStore.setUserInfo(user)
    userStore.setRefreshToken(refreshToken)
    console.log('登录成功:', response)
    // 跳转到首页或仪表板
    router.push('/home')
  }).catch((error) => {
    console.error('登录失败:', error)
    errMsg.value = error.message || '登录失败，请重试'
  })
}

const handleRegister = () => {
  if(isForgetPassword.value){
    handleResetPassword()
    return
  }
  // 每次点击先重置错误
  resetErrors()
  let hasError = false

  // 1. 校验空值
  if (!username.value.trim()) {
    errorFields.username = true
    hasError = true
  }
  if (!password.value.trim()) {
    errorFields.password = true
    hasError = true
  }
  if (!confirmPassword.value.trim()) {
    errorFields.confirmPassword = true
    hasError = true
  }

  if (hasError) {
    errMsg.value = '请填写完整信息' // 页面显示
    return
  }

  // 2. 校验两次密码是否一致
  if (password.value !== confirmPassword.value) {
    errorFields.confirmPassword = true
    errMsg.value = '两次输入的密码不一致'
    return
  }

  // 3. 校验通过，执行注册逻辑
  errMsg.value = '' // 清除错误信息
  isRegister.value = false
  register(username.value, password.value, department.value).then((response) => {
    console.log('注册成功:', response)
  }).catch((error) => {
    console.error('注册失败:', error)
  })
}

const forgotPassword = () => {
  // 这里可以实现忘记密码的逻辑，例如跳转到重置密码页面
  isRegister.value = true
  resetErrors()
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
  department.value = ''
  isForgetPassword.value = true
}

const handleResetPassword = () => {
  if (!username.value.trim()) {
    errorFields.username = true
    errMsg.value = '请输入用户名'
    return
  }
  if (!password.value.trim()) {
    errorFields.password = true
    errMsg.value = '请输入新密码'
    return
  }
  if(!confirmPassword.value.trim()) {
    errorFields.confirmPassword = true
    errMsg.value = '请确认新密码'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorFields.confirmPassword = true
    errMsg.value = '两次输入的密码不一致'
    return
  }
  // 这里可以实现重置密码的逻辑，例如调用重置密码的 API
  resetPassword(username.value, password.value).then((response) => {
    console.log('重置密码成功:', response)
    // 重置成功后可以自动跳转回登录页面
    isForgetPassword.value = false
    isRegister.value = false
    resetErrors()
    username.value = ''
    password.value = ''
    confirmPassword.value = ''
    department.value = ''
    errMsg.value = '密码重置成功，请使用新密码登录'
  }).catch((error) => {
    console.error('重置密码失败:', error)
    errMsg.value = error.message || '重置密码失败，请重试'
  })
}
</script>

<style scoped>
/* 登录相关样式 */
.login-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  top: 30px;
}

.school-logo {
  width: 100%;
  margin: 30px 50px 32px;
  display: flex;
  align-items: center;
}
.login-title {
  font-size: 36px;
  color: #0053a4;
  margin-top: 16px;
  font-weight: bold;
  margin-left: 20px;
}

.login-background {
  position: relative;
  top: 0;
  left: 0;
  object-fit: cover;
  z-index: -1;
}

.login-form {
  position: absolute;
  width: 400px;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-form-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 24px;
  text-align: center;
}

.login-form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  align-items: center;
}
.form-item label {
  width: 70px;
  text-align: right;
  margin-right: 10px;
  white-space: nowrap;
  transition: color 0.2s ease;
}
.form-item .n-input {
  flex: 1;
}
.form-item .n-select {
  flex: 1;
}

/* 错误文字红色 */
.form-item label.error {
  color: red !important;
}

/* 错误输入框红色边框 */
:deep(.input-error .n-input__wrapper) {
  border-color: red !important;
  box-shadow: 0 0 0 2px rgba(255, 0, 0, 01) !important;
}

/* 抖动动画 */
.shake {
  animation: inputShake 0.4s ease-in-out;
}
@keyframes inputShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-6px); }
}

.login-button {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.forget-password {
  margin-top: 10px;
  color: #007bff;
  cursor: pointer;
  width: 20%;
}
</style>