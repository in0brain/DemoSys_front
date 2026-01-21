<template>
  <div class="page">
    <el-card shadow="never" class="mb-12">
      <div class="toolbar">
        <div>
          <h2 style="margin:0;">在线选课（静态闭环）</h2>
          <div class="hint">一次性提交，不支持修改/撤回；无冲突/容量/规则校验。</div>
        </div>

        <div class="right">
          <el-tag type="info">当前用户：{{ currentUser.displayName }}（{{ currentUser.role }}）</el-tag>
          <el-button type="primary" :disabled="selected.length===0" @click="submitApply">
            提交选课申请（{{ selected.length }}）
          </el-button>
        </div>
      </div>

      <el-alert
          title="提交后流转：学生提交 → 导师审批 → 学院终审 → 学生可查已通过课程/累计学分（本页用 localStorage 模拟）"
          type="success"
          :closable="false"
          style="margin-top:12px;"
      />
    </el-card>

    <el-card shadow="never" class="mb-12">
      <template #header>
        <div class="card-header">
          <span>可选课程（静态数据）</span>
          <el-input v-model="keyword" placeholder="按课程名/课程号筛选" style="width:260px;" clearable />
        </div>
      </template>

      <el-table
          :data="filteredCourses"
          border
          style="width:100%;"
          @selection-change="(rows)=> selected = rows"
      >
        <el-table-column type="selection" width="44" />
        <el-table-column prop="courseCode" label="课程编号" width="140" />
        <el-table-column prop="courseName" label="课程名称" min-width="220" />
        <el-table-column prop="credit" label="学分" width="90" />
        <el-table-column label="说明" min-width="240">
          <template #default>
            <el-tag size="small" type="info">不校验冲突/容量</el-tag>
            <el-tag size="small" type="warning" style="margin-left:8px;">提交后不可改</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的申请记录（静态）</span>
          <el-button @click="loadApplies">刷新</el-button>
        </div>
      </template>

      <el-table :data="myApplies" border style="width:100%;">
        <el-table-column prop="id" label="申请ID" width="180" />
        <el-table-column prop="submitTime" label="提交时间" width="170" />
        <el-table-column label="状态" width="160">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
            <span style="margin-left:8px;color:#999;">{{ nodeText(row.currentNode) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="课程数/学分" width="160">
          <template #default="{ row }">
            {{ row.courses?.length || 0 }} 门 / {{ sumCredits(row.courses) }} 学分
          </template>
        </el-table-column>
        <el-table-column label="明细">
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
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ✅ 引入教育域 API
import {
  fetchCourses,
  submitEnrollment,
  fetchMyEnrollments,
} from '@/domain/education/service/education.api'

/** ========== 当前用户展示（后续换 auth.state 的 /me） ========== */
const currentUser = ref({
  userId: 1001,
  displayName: '张三',
  role: 'STUDENT',
})

/** ========== 页面状态 ========== */
const keyword = ref('')
const selected = ref([])
const courses = ref([])
const myApplies = ref([])
const loadingCourses = ref(false)
const loadingApplies = ref(false)

/** ========== 课程过滤（前端二次过滤，后端也支持 keyword） ========== */
const filteredCourses = computed(() => {
  const kw = (keyword.value || '').trim().toLowerCase()
  if (!kw) return courses.value
  return courses.value.filter(x =>
      String(x.courseCode || '').toLowerCase().includes(kw) ||
      String(x.courseName || '').toLowerCase().includes(kw)
  )
})

function sumCredits(list) {
  const n = (list || []).reduce((s, c) => s + Number(c.credit || 0), 0)
  return Math.round(n * 10) / 10
}

/** ========== 文案（保持你原来的） ========== */
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
function nodeText(n) {
  if (n === 'ADVISOR') return '节点：导师'
  if (n === 'COLLEGE') return '节点：学院'
  if (n === 'DONE') return '已结束'
  return ''
}

/**
 * =========================
 * 后端联调：加载课程
 * =========================
 */
async function loadCourses() {
  loadingCourses.value = true
  try {
    const resp = await fetchCourses({
      keyword: keyword.value || '',
    })

    // ApiResponse：{ code, message, data }
    const data = resp?.data
    const items = data?.items || []

    courses.value = items.map(x => ({
      courseId: x.id,
      courseCode: x.courseCode,
      courseName: x.courseName,
      credit: x.credit,
    }))
  } catch (e) {
    console.error(e)
    ElMessage.error('加载课程失败')
  } finally {
    loadingCourses.value = false
  }
}


/**
 * =========================
 * 后端联调：加载我的申请
 * =========================
 */
async function loadApplies() {
  loadingApplies.value = true
  try {
    const resp = await fetchMyEnrollments()
    const data = resp?.data
    myApplies.value = Array.isArray(data) ? data : (data?.items || [])
  } catch (e) {
    console.error(e)
    ElMessage.error('加载我的申请失败')
  } finally {
    loadingApplies.value = false
  }
}

/**
 * =========================
 * 后端联调：提交申请
 * =========================
 */
async function submitApply() {
  if (selected.value.length === 0) return

  await ElMessageBox.confirm(
      `确认提交？将提交 ${selected.value.length} 门课（${sumCredits(selected.value)} 学分），提交后不可修改/撤回。`,
      '提交确认',
      { type: 'warning' }
  )

  try {
    // ✅ 按我们 EnrollmentServiceImpl 的 submit(req) 逻辑：
    // 需要 courses: [{ courseCode, courseId?, courseName?, credit? }]
    const payload = {
      courses: selected.value.map(c => ({
        courseId: c.courseId ?? c.id ?? null,
        courseCode: c.courseCode,
        courseName: c.courseName,
        credit: c.credit,
      })),
    }

    const resp = await submitEnrollment(payload)
    if (resp?.code !== 0) {
      // 兼容你 ApiResponse 的 code 约定
      ElMessage.error(resp?.message || '提交失败')
      return
    }

    ElMessage.success('提交成功：已进入“导师待办”')
    selected.value = []
    await loadApplies()
  } catch (e) {
    console.error(e)
    ElMessage.error('提交失败（请检查后端日志/接口返回）')
  }
}

/** ========== 生命周期 ========== */
onMounted(async () => {
  await loadCourses()
  await loadApplies()
})
</script>

<!--<script setup>-->
<!--import { computed, onMounted, ref } from 'vue'-->
<!--import { ElMessage, ElMessageBox } from 'element-plus'-->

<!--/** ========== 静态用户（后续换成 auth.state 的 /me） ========== */-->
<!--const currentUser = ref({-->
<!--  userId: 1001,-->
<!--  displayName: '张三',-->
<!--  role: 'STUDENT', // 仅用于展示-->
<!--})-->

<!--/** ========== 静态课程库 ========== */-->
<!--const courses = ref([-->
<!--  { courseCode: 'CS5001', courseName: '高级计算机网络', credit: 3.0 },-->
<!--  { courseCode: 'CS5002', courseName: '矩阵分析', credit: 3.0 },-->
<!--  { courseCode: 'CS5003', courseName: '机器学习导论', credit: 3.0 },-->
<!--  { courseCode: 'CS5004', courseName: '现代密码学', credit: 2.0 },-->
<!--  { courseCode: 'CS5005', courseName: '学术写作与规范', credit: 1.0 },-->
<!--])-->

<!--/** ========== localStorage（模拟后端） ========== */-->
<!--const KEY = 'EDU_APPLIES_V1'-->

<!--function nowText() {-->
<!--  const d = new Date()-->
<!--  const pad = (n) => String(n).padStart(2, '0')-->
<!--  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`-->
<!--}-->

<!--function loadAllApplies() {-->
<!--  try {-->
<!--    const raw = localStorage.getItem(KEY)-->
<!--    const arr = raw ? JSON.parse(raw) : []-->
<!--    return Array.isArray(arr) ? arr : []-->
<!--  } catch {-->
<!--    return []-->
<!--  }-->
<!--}-->
<!--function saveAllApplies(list) {-->
<!--  localStorage.setItem(KEY, JSON.stringify(list))-->
<!--}-->

<!--/** ========== 页面状态 ========== */-->
<!--const keyword = ref('')-->
<!--const selected = ref([])-->
<!--const myApplies = ref([])-->

<!--const filteredCourses = computed(() => {-->
<!--  const kw = (keyword.value || '').trim().toLowerCase()-->
<!--  if (!kw) return courses.value-->
<!--  return courses.value.filter(x =>-->
<!--      x.courseCode.toLowerCase().includes(kw) ||-->
<!--      x.courseName.toLowerCase().includes(kw)-->
<!--  )-->
<!--})-->

<!--function sumCredits(list) {-->
<!--  const n = (list || []).reduce((s, c) => s + Number(c.credit || 0), 0)-->
<!--  return Math.round(n * 10) / 10-->
<!--}-->

<!--/** ========== 文案 ========== */-->
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
<!--function nodeText(n) {-->
<!--  if (n === 'ADVISOR') return '节点：导师'-->
<!--  if (n === 'COLLEGE') return '节点：学院'-->
<!--  if (n === 'DONE') return '已结束'-->
<!--  return ''-->
<!--}-->

<!--/** ========== 行为：提交申请 ========== */-->
<!--async function submitApply() {-->
<!--  await ElMessageBox.confirm(-->
<!--      `确认提交？将提交 ${selected.value.length} 门课（${sumCredits(selected.value)} 学分），提交后不可修改/撤回。`,-->
<!--      '提交确认',-->
<!--      { type: 'warning' }-->
<!--  )-->

<!--  const applyId = `A${Date.now()}`-->
<!--  const apply = {-->
<!--    id: applyId,-->
<!--    studentId: currentUser.value.userId,-->
<!--    studentName: currentUser.value.displayName,-->
<!--    status: 'SUBMITTED',-->
<!--    currentNode: 'ADVISOR',-->
<!--    submitTime: nowText(),-->
<!--    finishTime: null,-->
<!--    courses: selected.value.map(c => ({ ...c })),-->
<!--    audits: [],-->
<!--  }-->

<!--  const all = loadAllApplies()-->
<!--  all.unshift(apply)-->
<!--  saveAllApplies(all)-->

<!--  ElMessage.success('提交成功：已进入“导师待办”')-->
<!--  selected.value = []-->
<!--  loadApplies()-->
<!--}-->

<!--function loadApplies() {-->
<!--  const all = loadAllApplies()-->
<!--  myApplies.value = all.filter(x => x.studentId === currentUser.value.userId)-->
<!--}-->

<!--onMounted(loadApplies)-->
<!--</script>-->

<style scoped>
.page { padding: 12px; }
.mb-12 { margin-bottom: 12px; }
.toolbar {
  display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
}
.hint { color:#666; font-size:12px; margin-top:6px; }
.right { display:flex; align-items:center; gap:10px; }
.card-header { display:flex; align-items:center; justify-content:space-between; }
</style>
