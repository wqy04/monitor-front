<template>
    <div class="side-bar">
        <div class="logo-area">
            <img 
                src="/public/images/schoolLogo1.png" 
                alt="学校Logo" 
                class="school-logo"
            />
        </div>
        <!-- 用户信息区域 -->
        <div class="user-info">
            <div class="avatar">
                {{ userInitial }}
            </div>
            <div class="user-details">
                <div class="user-name">{{ userStore.userName }}</div>
                <div class="user-role" :class="roleClass">{{ userStore.userRole }}</div>
            </div>
        </div>

        <!-- 导航菜单 -->
        <nav class="menu-nav">
            <ul>
                <li 
                    v-for="item in menuItems" 
                    :key="item.key"
                    @click="navigateTo(item.key)"
                    :class="{ 'active': activeMenu === item.key }"
                >
                    <img v-if="item.icon.endsWith('.png')" class="menu-icon" :src="item.icon" />
                    <span v-else class="menu-icon">{{ item.icon }}</span>
                    <span class="menu-label">{{ item.label }}</span>
                </li>
            </ul>
        </nav>

        <!-- 底部版本信息 -->
        <div class="footer-info">
            <span>系统版本 v2.0</span>
        </div>
    </div>    
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { logout } from '@/api/login'
const imgBaseUrl = import.meta.env.VITE_IMG_BASE_URL

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// 用户头像首字母
const userInitial = computed(() => {
    return userStore.userName ? userStore.userName.charAt(0) : '用'
})

// 根据角色动态添加样式类
const roleClass = computed(() => {
    return userStore.userRole === '系统管理员' ? 'role-admin' : 'role-user'
})

// 菜单项数据
const menuItems = ref([
    { key: 'dashboard', label: '工作台', icon: `${imgBaseUrl}/images/sideBarIcons/workspace.png` },
    { key: 'cluster',   label: '集群监控', icon: `${imgBaseUrl}/images/sideBarIcons/cluster.png` },
    { key: 'job',       label: '作业监控', icon: `${imgBaseUrl}/images/sideBarIcons/job.png` },
    { key: 'user',      label: '用户管理', icon: `${imgBaseUrl}/images/sideBarIcons/user.png` },
    { key: 'apps',      label: '应用监控', icon: `${imgBaseUrl}/images/sideBarIcons/apps.png` },
    { key: 'alarm',     label: '告警管理', icon: `${imgBaseUrl}/images/sideBarIcons/alarm.png` },
    { key: 'profile',   label: '个人中心', icon: `${imgBaseUrl}/images/sideBarIcons/profile.png` },
    { key: 'logout',    label: '退出登录', icon: `${imgBaseUrl}/images/sideBarIcons/logout.png` }
])

const activeMenu = ref('dashboard')

// 根据当前路由更新激活菜单
const updateActiveMenu = () => {
    const routeName = route.name
    if (routeName && typeof routeName === 'string') {
        activeMenu.value = routeName
    }
}

// 监听路由变化
watch(() => route.name, updateActiveMenu, { immediate: true })

// 导航到对应页面
const navigateTo = (key) => {
    if(key === 'logout') {
        // 处理退出登录逻辑
        logout().catch(() => {
            console.warn('登出请求失败（可能 token 已过期）', err);
        }).finally(() => {
            userStore.logout()
            router.push('/login') // 跳转到登录页
        }) 
        return
    }
    // 如果已经是当前页面，无需重复跳转
    if (activeMenu.value === key) return
    router.push({ name: key })
}
</script>

<style scoped>
/* 重置列表样式 & 基础盒模型 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* 侧边栏容器 - 深蓝背景 #0053a4，垂直弹性布局，占满视口高度 */
.side-bar {
    width: 280px;
    height: 100vh;
    background-color: #0053a4;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
}

.logo-area {
    padding: 24px 20px 16px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    margin-bottom: 8px;
}

.school-logo {
    max-width: 180px;      /* 限制最大宽度，适应长方形 */
    width: 100%;
    height: auto;
    max-height: 64px;      /* 限制最大高度，保持侧边栏顶部整洁 */
    object-fit: contain;   /* 确保比例不变，不裁剪 */
    filter: brightness(0) invert(1); /* 若原Logo颜色较深，可统一转为白色调；如原图合适可删除此行 */
    /* 如果Logo本身在深色背景下清晰，可移除 filter，或根据实际情况调整 */
}
/* 用户信息区域 - 弹性布局，精致间距 */
.user-info {
    display: flex;
    align-items: center;
    padding: 28px 20px 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    margin-bottom: 12px;
}

/* 圆形头像 */
.avatar {
    width: 48px;
    height: 48px;
    background: #ffffff;
    color: #0053a4;
    font-size: 22px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin-right: 14px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    text-transform: uppercase;
    flex-shrink: 0;
}

/* 用户详情（姓名+角色） */
.user-details {
    flex: 1;
    overflow: hidden;
}

.user-name {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 角色标签基础样式 */
.user-role {
    display: inline-block;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(2px);
    line-height: 1.2;
    letter-spacing: 0.3px;
}

/* 系统管理员角色标签（金色强调） */
.role-admin {
    background: rgba(255, 215, 120, 0.25);
    color: #FFE9A7;
    border: 0.5px solid rgba(255, 215, 120, 0.4);
}

/* 普通用户角色标签（清爽灰白） */
.role-user {
    background: rgba(255, 255, 255, 0.2);
    color: #E8EDF2;
}

/* 导航菜单容器 - 可滚动区域 */
.menu-nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
}

/* 自定义滚动条 (Webkit) */
.menu-nav::-webkit-scrollbar {
    width: 5px;
}
.menu-nav::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
}
.menu-nav::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 10px;
}
.menu-nav::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

/* 菜单列表 */
.menu-nav ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* 菜单项 - 可点击区域 */
.menu-nav li {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1);
    color: #f0f4fa;
    font-weight: 500;
    gap: 12px;
}

/* 菜单项悬停效果 */
.menu-nav li:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateX(3px);
}

/* 激活菜单项样式 - 更明亮的背景 + 左侧装饰条 */
.menu-nav li.active {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    position: relative;
}

.menu-nav li.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 24px;
    background-color: #FFD966;
    border-radius: 4px;
    transition: height 0.2s;
}

/* 菜单图标 */
.menu-icon {
    font-size: 1.35rem;
    width: 28px;
    text-align: center;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
}

/* 菜单文字 */
.menu-label {
    font-size: 15px;
    letter-spacing: 0.3px;
}

/* 底部版本信息区域 - 精致且不干扰内容 */
.footer-info {
    padding: 20px 24px 24px 24px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    background: transparent;
    letter-spacing: 0.3px;
}

/* 响应式微调 - 若屏幕高度较小，减少用户区内边距 */
@media (max-height: 600px) {
    .user-info {
        padding: 18px 20px 14px 20px;
    }
    .menu-nav li {
        padding: 8px 14px;
    }
    .footer-info {
        padding: 12px 20px;
    }
}
</style>