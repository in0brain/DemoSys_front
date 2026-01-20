<template>
  <div class="page">
    <div class="card">
      <h2>登录</h2>
      <p class="hint">开发模式：账号 <b>admin</b>，密码 <b>admin@123</b></p>

      <label class="label">账号</label>
      <input class="ipt" v-model.trim="username" placeholder="请输入账号" />

      <label class="label">密码</label>
      <input class="ipt" v-model="password" type="password" placeholder="请输入密码" @keyup.enter="onLogin" />

      <div v-if="error" class="error">{{ error }}</div>

      <button class="btn" :disabled="loading" @click="onLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loginLocal } from '../service/auth.local'

const router = useRouter()
const route = useRoute()

const username = ref('admin')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await loginLocal({ username: username.value, password: password.value })
    if (!res.ok) {
      error.value = res.message || '登录失败'
      return
    }
    const redirect = route.query.redirect || '/dashboard'
    router.replace(String(redirect))
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
.page { min-height: 70vh; display:flex; align-items:center; justify-content:center; padding: 24px; }
.card { width: 360px; border: 1px solid #eee; border-radius: 12px; padding: 18px; background: #fff; }
.label { display:block; margin-top: 12px; margin-bottom: 6px; font-size: 12px; color:#666; }
.ipt { width:100%; height: 36px; border: 1px solid #ddd; border-radius: 8px; padding: 0 10px; outline: none; }
.ipt:focus { border-color: #999; }
.btn { width:100%; height: 38px; margin-top: 14px; border: 0; border-radius: 10px; cursor:pointer; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
.error { margin-top: 10px; color: #b00020; font-size: 12px; }
.hint { margin: 6px 0 10px; color:#777; font-size: 12px; }
</style>
