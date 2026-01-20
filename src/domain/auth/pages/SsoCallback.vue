<template>
  <div class="page">
    <h2>SSO 回调（占位）</h2>
    <p>这里模拟拿到 code 后换 token。</p>
    <button class="btn" @click="finish">完成回调并登录</button>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { setToken } from '../service/auth.service'

const router = useRouter()
const route = useRoute()

function finish() {
  const code = route.query.code || 'no-code'
  setToken(`demo-sso-token:${code}:${Date.now()}`)
  router.replace('/dashboard')
}
</script>

<style scoped>
.page { padding: 16px; }
.btn { padding: 10px 12px; border-radius: 10px; border: 1px solid #ddd; cursor:pointer; }
</style>
