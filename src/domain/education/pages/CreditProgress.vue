<template>
  <div class="page">
    <el-card shadow="never" class="mb-12">
      <div class="toolbar">
        <div>
          <h2 style="margin:0;">学分进度（静态闭环）</h2>
          <div class="hint">只统计“学院终审通过”的课程；不做预警、不做实时进度监控。</div>
        </div>

        <div class="right">
          <el-tag type="info">当前用户：{{ currentUser.displayName }}（{{ currentUser.userId }}）</el-tag>
          <el-button @click="load">刷新</el-button>
          <el-button type="danger" plain @click="clearAll">清空静态数据</el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="12" class="mb-12">
      <el-col :span="8">
        <el-card shadow="never">
          <div class="kpi">
            <div class="kpi-title">累计已通过学分</div>
            <div class="kpi-value">{{ totalCredit }}</div>
            <div class="kpi-sub">来源：学院终审通过的申请课程</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <div class="kpi">
            <div class="kpi-title">审批结果总览</div>
            <div class="kpi-sub">
              <el-tag type="info">已提交 {{ countBy('SUBMITTED') }}</el-tag>
              <el-tag type="warning" style="margin-left:8px;">待学院 {{ countBy('ADVISOR_APPROVED') }}</el-tag>
              <el-tag type="success" style="margin-left:8px;">已通过 {{ countBy('COLLEGE_APPROVED') }}</el-tag>
              <el-tag type="danger" style="margin-left:8px;">已驳回 {{ countBy('REJECTED') }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-12">
      <template #header>
        <div class="card-header">
          <span>已通过课程（学院终审通过）</span>
        </div>
      </template>

      <el-table :data="approvedCourses" border style="width:100%;">
        <el-table-column prop="courseCode" label="课程编号" width="140" />
        <el-table-column prop="courseName" label="课程名称" min-width="220" />
        <el-table-column prop="credit" label="学分" width="90" />
        <el-table-column prop="fromApplyId" label="来源申请ID" width="190" />
        <el-table-column prop="approvedTime" label="通过时间" width="170" />
      </el-table>

      <div v-if="approvedCourses.length===0" style="padding:16px;color:#999;">
        暂无通过课程。请先在“选课”提交申请，再到“选课审批”完成导师/学院审批。
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的申请列表</span>
        </div>
      </template>

      <el-table :data="myApplies" border style="width:100%;">
        <el-table-column prop="id" label="申请ID" width="180" />
        <el-table-column prop="submitTime" label="提交时间" width="170" />
        <el-table-column label="状态" width="180">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="课程/学分" width="160">
          <template #default="{ row }">
            {{ row.courses?.length || 0 }} 门 / {{ sumCredits(row.courses) }} 学分
          </template>
        </el-table-column>
        <el-table-column label="审批记录">
          <template #default="{ row }">
            <div v-if="(row.audits||[]).length===0" style="color:#999;">无</div>
            <div v-else>
              <el-tag
                  v-for="(a,i) in row.audits"
                  :key="i"
                  size="small"
                  style="margin-right:6px;margin-bottom:6px;"
                  :type="a.action==='APPROVE' ? 'success' : 'danger'"
              >
                {{ a.node }} {{ a.auditorName }}：{{ a.action }}（{{ a.actionTime }}）
              </el-tag>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import {
  getCreditsMe,
  fetchMyEnrollments,
} from '@/domain/education/service/education.api'

/** ========== 当前用户展示（后续换 auth.state 的 /me） ========== */
const currentUser = ref({
  userId: 1001,
  displayName: '张三',
})

/** ========== 页面数据 ========== */
const myApplies = ref([])
const approvedCourses = ref([])
const totalCredit = ref(0)

/** ========== utils ========== */
function sumCredits(list) {
  const n = (list || []).reduce((s, c) => s + Number(c.credit || 0), 0)
  return Math.round(n * 10) / 10
}

function statusText(s) {
  if (s === 'SUBMITTED') return '已提交（待导师）'
  if (s === 'ADVISOR_APPROVED') return '导师已通过（待学院）'
  if (s === 'COLLEGE_APPROVED') return '学院终审通过'
  if (s === 'REJECTED') return '已驳回'
  return s || '-'
}
function statusTagType(s) {
  if (s === 'SUBMITTED') return 'info'
  if (s === 'ADVISOR_APPROVED') return 'warning'
  if (s === 'COLLEGE_APPROVED') return 'success'
  if (s === 'REJECTED') return 'danger'
  return 'info'
}

function countBy(status) {
  return (myApplies.value || []).filter(x => x.status === status).length
}

/**
 * =========================
 * 联调：加载学分 + 通过课程
 * =========================
 * CreditsMeResponse（我们默认结构）：
 * {
 *   studentId,
 *   totalCredit,
 *   passedCourses: [
 *     { courseCode, courseName, credit, fromEnrollmentId, approvedTime }
 *   ]
 * }
 *
 * 注意：你 template 用的是 fromApplyId，这里做字段映射兼容
 */
async function loadCredits() {
  const resp = await getCreditsMe()
  if (resp?.code !== 0) {
    throw new Error(resp?.message || '加载学分失败')
  }

  const data = resp?.data || {}
  totalCredit.value = Number(data.totalCredit || 0)

  const passed = Array.isArray(data.passedCourses) ? data.passedCourses : []
  approvedCourses.value = passed.map(c => ({
    courseCode: c.courseCode,
    courseName: c.courseName,
    credit: c.credit,
    // template 用 fromApplyId，这里兼容映射
    fromApplyId: c.fromEnrollmentId ?? c.fromApplyId ?? null,
    approvedTime: c.approvedTime,
  }))
}

/**
 * =========================
 * 联调：加载我的申请列表
 * =========================
 */
async function loadMyEnrollments() {
  const resp = await fetchMyEnrollments()
  if (resp?.code !== 0) {
    throw new Error(resp?.message || '加载我的申请失败')
  }

  // 后端：/education/enrollments 返回 List<EnrollmentsResponse>
  const data = resp?.data
  myApplies.value = Array.isArray(data) ? data : []
}

/**
 * =========================
 * 刷新
 * =========================
 */
async function load() {
  try {
    // 先拿申请列表（KPI “已提交/待学院/已通过/已驳回”用它统计）
    await loadMyEnrollments()
    // 再拿学分汇总与通过课程（列表展示用它）
    await loadCredits()
  } catch (e) {
    console.error(e)
    ElMessage.error(e?.message || '加载失败')
  }
}

/**
 * SR 真实联调：不再允许清空后端数据
 * 如果你想保留按钮，这里只提示
 */
async function clearAll() {
  ElMessage.warning('当前为后端联调模式，不支持在前端清空数据。')
}

onMounted(load)
</script>

<style scoped>
.page { padding: 12px; }
.mb-12 { margin-bottom: 12px; }
.toolbar { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.hint { color:#666; font-size:12px; margin-top:6px; }
.right { display:flex; align-items:center; gap:10px; }
.card-header { display:flex; align-items:center; justify-content:space-between; }
.kpi { padding: 6px 0; }
.kpi-title { color:#666; font-size:12px; }
.kpi-value { font-size: 34px; font-weight: 700; margin-top: 6px; }
.kpi-sub { color:#999; font-size:12px; margin-top: 8px; }
</style>
