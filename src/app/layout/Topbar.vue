<template>
  <div class="bar">
    <div class="left">
      <a class="collapse-btn" href="#" @click.prevent="$emit('toggleSidebar')">☰</a>
      <strong>研究生管理系统</strong>
    </div>

    <div class="right">
      <router-link to="/profile">个人中心</router-link>
      <span class="sep">|</span>
      <a href="#" @click.prevent="onLogout">退出</a>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { clearToken } from '../../domain/auth/service/auth.service'

defineEmits(['toggleSidebar'])

const router = useRouter()
function onLogout() {
  clearToken()
  router.replace('/login')
}
</script>

<style scoped>
.bar { height: 100%; display:flex; align-items:center; justify-content:space-between; padding:0 16px; }
.left { display:flex; align-items:center; gap: 10px; }
.collapse-btn { text-decoration: none; font-size: 18px; line-height: 1; }
.sep { margin: 0 8px; color:#999; }
a { text-decoration: none; }
</style>
