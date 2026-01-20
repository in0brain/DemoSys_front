<template>
  <div class="layout">
    <div class="sidebar" :style="{ width: collapsed ? '64px' : '240px' }">
      <Sidebar :collapsed="collapsed" @toggle="collapsed = !collapsed" />
    </div>

    <div class="main">
      <Topbar class="topbar" @toggleSidebar="collapsed = !collapsed" />
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'

const collapsed = ref(localStorage.getItem('SIDEBAR_COLLAPSED') === '1')
</script>

<style scoped>
.layout { display: flex; height: 100vh; }
.sidebar { border-right: 1px solid #eee; transition: width .15s ease; overflow: hidden; }
.main { flex: 1; display: flex; flex-direction: column; }
.topbar { height: 56px; border-bottom: 1px solid #eee; }
.content { padding: 16px; overflow: auto; }
</style>
