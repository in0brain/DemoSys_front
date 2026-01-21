<template>
  <div class="page">
    <el-card shadow="never" class="mb-12">
      <div class="toolbar">
        <div>
          <h2 style="margin:0;">选课审批（静态闭环）</h2>
          <div class="hint">
            本页模拟两级审批：导师节点（SUBMITTED）→ 学院节点（ADVISOR_APPROVED）。
          </div>
        </div>

        <div class="right">
          <el-select v-model="actingRole" style="width: 200px;">
            <el-option label="导师视角（处理导师待办）" value="ADVISOR" />
            <el-option label="学院视角（处理学院待办）" value="COLLEGE" />
          </el-select>
          <el-button @click="load">刷新</el-button>
        </div>
      </div>

      <el-alert
          title="不支持批注/会签；通过/驳回即写入审批记录，并推动状态机。"
          type="info"
          :closable="false"
          style="margin-top:12px;"
      />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的待办列表（{{ actingRole==='ADVISOR'?'导师':'学院' }}）</span>
          <el-tag type="info">共 {{ todos.length }} 条</el-tag>
        </div>
      </template>

      <el-table :data="todos" border style="width:100%;">
        <el-table-column prop="id" label="申请ID" width="180" />
        <el-table-column label="学生" width="160">
          <template #default="{ row }">
            {{ row.studentName }}（{{ row.studentId }}）
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="170" />
        <el-table-column label="当前状态" width="180">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="课程/学分" width="160">
          <template #default="{ row }">
            {{ row.courses?.length || 0 }} 门 / {{ sumCredits(row.courses) }} 学分
          </template>
        </el-table-column>
        <el-table-column label="课程明细">
          <template #default="{ row }">
            <el-tag
                v-for="c in row.courses"
                :key="c.courseCode"
                size="small"
                style="margin-right:6px;margin-bottom:6px;"
            >
              {{ c.courseCode }} {{ c.courseName }}（{{ c.credit }}）
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="approve(row)">通过</el-button>
            <el-button type="danger" size="small" @click="reject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="todos.length===0" style="padding:16px;color:#999;">
        当前节点暂无待办。
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  fetchEnrollmentTodos,
  approveEnrollment,
  rejectEnrollment,
} from '@/domain/education/service/education.api'

const actingRole = ref('ADVISOR') // ADVISOR / COLLEGE

// 审批人展示（仅展示；真实审计由后端按登录人写）
const auditor = computed(() => {
  if (actingRole.value === 'ADVISOR') {
    return { auditorName: '李导师', auditorRole: 'TEACHER' }
  }
  return { auditorName: '王秘书', auditorRole: 'ADMIN' }
})

const todos = ref([])
const loading = ref(false)

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

/**
 * 加载待办
 * 后端返回：
 * - 可能是 ApprovalsEnrollmentsResponse { items:[...] }
 * - 或者直接 List<Item>
 * 这里都兼容
 */
async function load() {
  loading.value = true
  try {
    const resp = await fetchEnrollmentTodos(actingRole.value)
    if (resp?.code !== 0) {
      ElMessage.error(resp?.message || '加载待办失败')
      todos.value = []
      return
    }

    const data = resp?.data
    let items = []

    if (Array.isArray(data)) items = data
    else if (data && Array.isArray(data.items)) items = data.items
    else items = []

    // 统一字段，避免 template 空指针
    todos.value = items.map(x => ({
      id: x.id,
      enrollmentNo: x.enrollmentNo,
      studentId: x.studentId,
      studentName: x.studentName,
      status: x.status,
      currentNode: x.currentNode,
      submitTime: x.submitTime,
      // 可选：后端有 courseCount/totalCredit/courses
      courses: Array.isArray(x.courses) ? x.courses : (Array.isArray(x.courseItems) ? x.courseItems : []),
      courseCount: x.courseCount,
      totalCredit: x.totalCredit,
    }))
  } catch (e) {
    console.error(e)
    ElMessage.error('加载待办失败（请检查网络/后端日志）')
    todos.value = []
  } finally {
    loading.value = false
  }
}

async function approve(row) {
  await ElMessageBox.confirm('确认通过该申请？', '审批确认', { type: 'warning' })
  try {
    const resp = await approveEnrollment(row.id)
    if (resp?.code !== 0) {
      ElMessage.error(resp?.message || '审批失败')
      return
    }
    ElMessage.success('已通过')
    await load()
  } catch (e) {
    console.error(e)
    ElMessage.error('审批失败（请检查后端日志/接口返回）')
  }
}

async function reject(row) {
  await ElMessageBox.confirm('确认驳回该申请？（将进入终态 REJECTED）', '驳回确认', { type: 'warning' })
  try {
    // SR：不要求原因，后端也可以忽略
    const resp = await rejectEnrollment(row.id, {})
    if (resp?.code !== 0) {
      ElMessage.error(resp?.message || '驳回失败')
      return
    }
    ElMessage.success('已驳回')
    await load()
  } catch (e) {
    console.error(e)
    ElMessage.error('驳回失败（请检查后端日志/接口返回）')
  }
}

// 切换视角自动刷新
watch(actingRole, () => {
  load()
})

onMounted(load)
</script>


<!--<script setup>-->
<!--import { computed, onMounted, ref } from 'vue'-->
<!--import { ElMessage, ElMessageBox } from 'element-plus'-->

<!--const KEY = 'EDU_APPLIES_V1'-->

<!--const actingRole = ref('ADVISOR') // ADVISOR / COLLEGE-->

<!--// 审批人（静态）-->
<!--const auditor = computed(() => {-->
<!--  if (actingRole.value === 'ADVISOR') {-->
<!--    return { auditorName: '李导师', auditorRole: 'TEACHER' }-->
<!--  }-->
<!--  return { auditorName: '王秘书', auditorRole: 'ADMIN' }-->
<!--})-->

<!--function nowText() {-->
<!--  const d = new Date()-->
<!--  const pad = (n) => String(n).padStart(2, '0')-->
<!--  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`-->
<!--}-->

<!--function loadAll() {-->
<!--  try {-->
<!--    const raw = localStorage.getItem(KEY)-->
<!--    const arr = raw ? JSON.parse(raw) : []-->
<!--    return Array.isArray(arr) ? arr : []-->
<!--  } catch {-->
<!--    return []-->
<!--  }-->
<!--}-->
<!--function saveAll(list) {-->
<!--  localStorage.setItem(KEY, JSON.stringify(list))-->
<!--}-->

<!--function sumCredits(list) {-->
<!--  const n = (list || []).reduce((s, c) => s + Number(c.credit || 0), 0)-->
<!--  return Math.round(n * 10) / 10-->
<!--}-->

<!--function statusText(s) {-->
<!--  if (s === 'SUBMITTED') return '已提交（待导师）'-->
<!--  if (s === 'ADVISOR_APPROVED') return '导师已通过（待学院）'-->
<!--  if (s === 'COLLEGE_APPROVED') return '学院终审通过'-->
<!--  if (s === 'REJECTED') return '已驳回'-->
<!--  return s || '-'-->
<!--}-->
<!--function statusTagType(s) {-->
<!--  if (s === 'SUBMITTED') return 'info'-->
<!--  if (s === 'ADVISOR_APPROVED') return 'warning'-->
<!--  if (s === 'COLLEGE_APPROVED') return 'success'-->
<!--  if (s === 'REJECTED') return 'danger'-->
<!--  return 'info'-->
<!--}-->

<!--/** 待办规则（严格按最简状态机） */-->
<!--const todos = ref([])-->

<!--function load() {-->
<!--  const all = loadAll()-->

<!--  if (actingRole.value === 'ADVISOR') {-->
<!--    todos.value = all.filter(x => x.currentNode === 'ADVISOR' && x.status === 'SUBMITTED')-->
<!--  } else {-->
<!--    todos.value = all.filter(x => x.currentNode === 'COLLEGE' && x.status === 'ADVISOR_APPROVED')-->
<!--  }-->
<!--}-->

<!--async function approve(row) {-->
<!--  await ElMessageBox.confirm('确认通过该申请？', '审批确认', { type: 'warning' })-->
<!--  const all = loadAll()-->
<!--  const idx = all.findIndex(x => x.id === row.id)-->
<!--  if (idx < 0) return-->

<!--  const a = all[idx]-->
<!--  const t = nowText()-->

<!--  if (actingRole.value === 'ADVISOR') {-->
<!--    a.status = 'ADVISOR_APPROVED'-->
<!--    a.currentNode = 'COLLEGE'-->
<!--    a.audits = a.audits || []-->
<!--    a.audits.push({-->
<!--      node: 'ADVISOR',-->
<!--      auditorRole: auditor.value.auditorRole,-->
<!--      auditorName: auditor.value.auditorName,-->
<!--      action: 'APPROVE',-->
<!--      actionTime: t,-->
<!--    })-->
<!--  } else {-->
<!--    a.status = 'COLLEGE_APPROVED'-->
<!--    a.currentNode = 'DONE'-->
<!--    a.finishTime = t-->
<!--    a.audits = a.audits || []-->
<!--    a.audits.push({-->
<!--      node: 'COLLEGE',-->
<!--      auditorRole: auditor.value.auditorRole,-->
<!--      auditorName: auditor.value.auditorName,-->
<!--      action: 'APPROVE',-->
<!--      actionTime: t,-->
<!--    })-->
<!--  }-->

<!--  saveAll(all)-->
<!--  ElMessage.success('已通过')-->
<!--  load()-->
<!--}-->

<!--async function reject(row) {-->
<!--  await ElMessageBox.confirm('确认驳回该申请？（将进入终态 REJECTED）', '驳回确认', { type: 'warning' })-->
<!--  const all = loadAll()-->
<!--  const idx = all.findIndex(x => x.id === row.id)-->
<!--  if (idx < 0) return-->

<!--  const a = all[idx]-->
<!--  const t = nowText()-->

<!--  a.status = 'REJECTED'-->
<!--  a.currentNode = 'DONE'-->
<!--  a.finishTime = t-->
<!--  a.audits = a.audits || []-->
<!--  a.audits.push({-->
<!--    node: actingRole.value,-->
<!--    auditorRole: auditor.value.auditorRole,-->
<!--    auditorName: auditor.value.auditorName,-->
<!--    action: 'REJECT',-->
<!--    actionTime: t,-->
<!--  })-->

<!--  saveAll(all)-->
<!--  ElMessage.success('已驳回')-->
<!--  load()-->
<!--}-->

<!--onMounted(load)-->
<!--</script>-->

<style scoped>
.page { padding: 12px; }
.mb-12 { margin-bottom: 12px; }
.toolbar { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.hint { color:#666; font-size:12px; margin-top:6px; }
.right { display:flex; align-items:center; gap:10px; }
.card-header { display:flex; align-items:center; justify-content:space-between; }
</style>
