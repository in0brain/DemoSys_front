<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="header">
          <div class="title">录取结果查询（公开）</div>
          <div class="actions">
            <el-button @click="goHome">返回首页（占位）</el-button>
          </div>
        </div>
      </template>

      <el-alert
          title="公开查询：输入姓名/考号关键字，查询公示录取结果（只读）"
          type="info"
          :closable="false"
          style="margin-bottom: 12px"
      />

      <el-form :inline="true" label-width="80px" @submit.prevent>
        <el-form-item label="关键字">
          <el-input
              v-model="keyword"
              placeholder="姓名 / 考号（主干最简）"
              style="width: 320px"
              clearable
              @keyup.enter="onQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onQuery">查询</el-button>
          <el-button :disabled="loading" @click="onClear">清空</el-button>
        </el-form-item>
      </el-form>

      <el-table
          :data="results"
          border
          stripe
          style="width: 100%; margin-top: 12px"
          v-loading="loading"
      >
        <el-table-column prop="name" label="姓名" width="160" />
        <el-table-column prop="examNo" label="考号" width="220" />
        <el-table-column prop="offerStatus" label="录取状态" width="160">
          <template #default="{ row }">
            <el-tag v-if="row.offerStatus === '已公示'" type="success">已公示</el-tag>
            <el-tag v-else type="info">{{ row.offerStatus }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="empty" v-if="!loading && results.length === 0">
        <el-empty description="暂无结果" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { queryPublicOffers } from '@/domain/admissions/service/admissions.api'

const keyword = ref('')
const loading = ref(false)
const results = ref([])

async function loadDefaultPublished() {
  loading.value = true
  try {
    // 不改后端：用 % 触发 name LIKE '%%%'，拿到所有 candidate，再前端过滤已公示
    const data = await queryPublicOffers('%')
    const items = Array.isArray(data?.items) ? data.items : []
    results.value = items.filter(it => it?.offerStatus === '已公示')
    if (results.value.length === 0) {
      ElMessage.info('暂无已公示数据')
    }
  } catch (e) {
    console.error(e)
    results.value = []
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}


// 你原来的查询按钮逻辑也建议这样包一层（避免白屏）
async function onQuery() {
  const kw = (keyword.value ?? '').trim()
  if (!kw) {
    ElMessage.warning('请输入姓名或考号')
    return
  }
  loading.value = true
  try {
    const data = await queryPublicOffers(kw)
    results.value = Array.isArray(data?.items) ? data.items : []
    if (results.value.length === 0) ElMessage.info('未查询到结果')
  } catch (e) {
    console.error(e)
    results.value = []
    ElMessage.error(e?.message || '查询失败')
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  loadDefaultPublished()
})
function onClear() {
  keyword.value = ''
  loadDefaultPublished()
}

</script>



<style scoped>
.page { padding: 16px; }
.header { display: flex; align-items: center; justify-content: space-between; }
.title { font-size: 16px; font-weight: 600; }
.empty { padding: 20px 0; }
</style>
