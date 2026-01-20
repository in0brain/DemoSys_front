<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="header">
          <div class="title">复试成绩录入</div>
          <div class="actions">
            <el-button @click="goBack">返回列表</el-button>
          </div>
        </div>
      </template>

      <el-alert
          title="一次性提交后不可修改（主干要求）。"
          type="info"
          :closable="false"
          style="margin-bottom: 12px"
      />

      <el-descriptions :column="3" border>
        <el-descriptions-item label="考生ID">{{ candidate.id }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ candidate.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="考号">{{ candidate.examNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="报考专业">-</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag v-if="locked" type="success">已锁定</el-tag>
          <el-tag v-else type="info">未提交</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注">提交后按钮禁用</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-form label-width="120px" style="max-width: 520px">
        <el-form-item label="复试成绩">
          <el-input
              v-model="score"
              placeholder="0~100（可小数）"
              :disabled="locked || submitting"
              style="width: 240px"
          />
          <span class="hint">示例：86.5</span>
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              :loading="submitting"
              :disabled="locked || submitting"
              @click="onSubmit"
          >
            提交并锁定
          </el-button>
          <el-button :disabled="locked || submitting" @click="score = ''">清空</el-button>
        </el-form-item>

        <el-form-item v-if="locked">
          <el-result icon="success" title="已锁定" sub-title="成绩已提交并锁定" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { submitInterviewScore } from '@/domain/admissions/service/admissions.api'

const route = useRoute()
const router = useRouter()

// 1) 从路由拿 candidateId
const candidateId = computed(() => {
  const id = route.params?.candidateId ?? route.params?.id
  return id ? Number(id) : null
})

// 2) candidate 基本信息：优先从 query 带过来（来自列表页跳转）
const candidate = ref({
  id: candidateId.value,
  name: route.query?.name || '',
  examNo: route.query?.examNo || '',
})

// 3) 锁定状态：默认 false，提交成功后置 true
const locked = ref(false)
const submitting = ref(false)

// 4) 分数输入
const score = ref('')

// 可选：如果列表页把 locked 状态也带过来，可以初始化锁定
onMounted(() => {
  // 如果你在列表跳转时传了 locked，可以启用下面这行
  // locked.value = route.query?.locked === 'true'
})

function goBack() {
  // ⚠️ 按你实际路由改：如果列表页路径不是这个，改这一行即可
  router.push('/admissions/candidates')
}

async function onSubmit() {
  if (!candidateId.value) {
    ElMessage.error('candidateId 缺失：请从列表页进入')
    return
  }

  const s = String(score.value ?? '').trim()
  if (!s) {
    ElMessage.error('请输入复试成绩')
    return
  }

  // 简单前端校验（后端也会校验）
  const n = Number(s)
  if (Number.isNaN(n) || n < 0 || n > 100) {
    ElMessage.error('成绩范围应为 0~100')
    return
  }

  submitting.value = true
  try {
    // admissions.api.js 已经 unwrap，拿到的是 data（CandidatesInterviewScoreResponse）
    const resp = await submitInterviewScore(candidateId.value, { score: n })

    locked.value = true
    // 如果后端回传 score，可同步回显
    if (resp && resp.score != null) score.value = String(resp.score)

    ElMessage.success('提交成功，已锁定')
  } catch (e) {
    // admissions.api.js 抛的是 Error(message)，这里直接用即可
    ElMessage.error(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { padding: 16px; }
.header { display: flex; align-items: center; justify-content: space-between; }
.title { font-size: 16px; font-weight: 600; }
.hint { margin-left: 10px; color: #909399; font-size: 12px; }
</style>
