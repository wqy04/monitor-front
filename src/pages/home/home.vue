<template>
    <div class="home">
        <SideBar />
        <div class="main-content">
            <router-view />
        </div>
    </div>
</template>

<script setup>  
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import SideBar from '@/components/sideBar.vue';

const userStore = useUserStore();
onMounted(() => {
    // 可在此处获取用户信息等初始化操作
});
</script>

<style scoped>
body {
    margin: 0;
}
.home {
    display: flex;
    width: 100%;
    height: 100vh;
    overflow: hidden;
}

.main-content {
    flex: 1;
    overflow-y: auto;
    background-color: #f5f7fa;
    padding: 20px;
}
</style>