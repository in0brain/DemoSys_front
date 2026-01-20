<template>
  <div class="page">
    <h2>个人中心</h2>
    <p>当前 token：</p>
    <pre class="box">{{ token }}</pre>
    <p class="hint">后续这里会替换成 /me 接口返回的用户信息（roles/permissions/profile）。</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getToken } from '../service/auth.service'

const token = computed(() => getToken() || '(未登录)')
</script>

<style scoped>
.page { padding: 8px; }
.box { padding: 12px; background:#f7f7f7; border-radius: 10px; overflow:auto; }
.hint { color:#666; }
</style>
