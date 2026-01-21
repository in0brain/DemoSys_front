<template>
  <div class="page-study-plan-approve">
    <el-card shadow="never" class="mb-16">
      <template #header>
        <div class="card-title">
          <span>培养计划审批</span>
          <el-tag type="info" effect="plain">静态演示</el-tag>
        </div>
      </template>

      <div class="toolbar">
        <div class="left">
          <el-input v-model="keyword" placeholder="搜索：学号/姓名/计划名称" clearable style="width: 320px" />
          <el-select v-model="status" clearable placeholder="状态筛选" style="width: 180px">
            <el-option label="待导师审核" value="advisor_pending" />
            <el-option label="待学院终审" value="admin_pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已退回" value="rejected" />
          </el-select>
        </div>
        <div class="right">
          <el-button @click="mockRefresh">刷新</el-button>
        </div>
      </div>

      <el-alert
          class="mt-12"
          type="info"
          :closable="false"
          title="说明：此页面演示“导师审核/学院终审”两段流程。后续接入后端后，将按当前登录角色自动显示可处理的待办。"
      />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-title">
          <span>待审批列表</span>
          <span class="muted">共 {{ filteredRows.length }} 条</span>
        </div>
      </template>

      <el-table :data="filteredRows" border size="small" height="520" @row-dblclick="openDetail">
        <el-table-column prop="studentNo" label="学号" width="110" />
        <el-table-column prop="studentName" label="姓名" width="90" />
        <el-table-column prop="programName" label="培养方案" min-width="200" show-overflow-tooltip />
        <el-table-column prop="title" label="计划名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="creditPlanned" label="规划学分" width="100" />
        <el-table-column prop="submittedAt" label="提交时间" width="160" />
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="plain">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">查看</el-button>
            <el-button
                type="success"
                link
                :disabled="!canApprove(row)"
                @click="quickApprove(row)"
            >
              通过
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="55%">
      <template #default>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="学号">{{ current.studentNo }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ current.studentName }}</el-descriptions-item>
          <el-descriptions-item label="导师">{{ current.advisorName }}</el-descriptions-item>
          <el-descriptions-item label="学院">{{ current.orgName }}</el-descriptions-item>
          <el-descriptions-item label="培养方案">{{ current.programName }}</el-descriptions-item>
          <el-descriptions-item label="计划名称">{{ current.title }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ current.submittedAt }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="statusTagType(current.status)" effect="plain">
              {{ statusText(current.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <div class="section-title">课程规划</div>
        <el-table :data="current.courses" border size="small" height="280">
          <el-table-column prop="code" label="课程号" width="110" />
          <el-table-column prop="name" label="课程名称" min-width="180" show-overflow-tooltip />
          <el-table-column label="类别" width="90">
            <template #default="{ row }">
              <el-tag :type="row.type === 'required' ? 'danger' : 'success'" effect="plain" size="small">
                {{ row.type === 'required' ? '必修' : '选修' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="credit" label="学分" width="70" />
          <el-table-column prop="term" label="学期" width="120" />
        </el-table>

        <div class="mt-12">
          <el-row :gutter="12">
            <el-col :span="8">
              <el-statistic title="规划总学分" :value="current.creditPlanned" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="必修学分" :value="current.creditRequiredPlanned" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="选修学分" :value="current.creditElectivePlanned" />
            </el-col>
          </el-row>
        </div>

        <el-divider />

        <div class="section-title">审批意见</div>
        <el-input
            v-model="opinion"
            type="textarea"
            :rows="3"
            placeholder="填写审批意见（演示）"
        />

        <div class="footer-actions">
          <el-button @click="drawerVisible = false">关闭</el-button>
          <el-button type="danger" :disabled="!canOperateCurrent" @click="rejectCurrent">
            退回修改
          </el-button>
          <el-button type="success" :disabled="!canOperateCurrent" @click="approveCurrent">
            审核通过
          </el-button>
        </div>

        <el-alert
            class="mt-12"
            type="warning"
            :closable="false"
            title="演示：当前“可操作”逻辑以 status 为准。后续会根据登录角色（导师/培养秘书）判断权限，并记录留痕。"
        />
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const keyword = ref('')
const status = ref('')

const rows = ref([
  {
    id: 101,
    studentNo: '20250001',
    studentName: '张三',
    advisorName: '李四 教授',
    orgName: '计算机学院',
    programName: '信息与通信工程（硕士）- 2025版',
    title: '2025级硕士培养计划（草稿）',
    submittedAt: '2026-01-10 09:12',
    status: 'advisor_pending',
    courses: [
      { code: 'ICE6101', name: '现代通信原理', type: 'required', credit: 3, term: '研一上' },
      { code: 'ICE6102', name: '数字信号处理', type: 'required', credit: 3, term: '研一上' },
      { code: 'ICE6104', name: '学术写作与规范', type: 'required', credit: 2, term: '研一上' },
      { code: 'ICE6201', name: '雷达系统与信号处理', type: 'elective', credit: 3, term: '研一下' },
    ],
  },
  {
    id: 102,
    studentNo: '20250002',
    studentName: '王五',
    advisorName: '赵六 副教授',
    orgName: '计算机学院',
    programName: '信息与通信工程（硕士）- 2025版',
    title: '培养计划（第一版）',
    submittedAt: '2026-01-10 10:05',
    status: 'admin_pending',
    courses: [
      { code: 'ICE6101', name: '现代通信原理', type: 'required', credit: 3, term: '研一上' },
      { code: 'ICE6103', name: '随机过程与应用', type: 'required', credit: 3, term: '研一下' },
      { code: 'ICE6202', name: '信息论与编码', type: 'elective', credit: 3, term: '研二上' },
    ],
  },
  {
    id: 103,
    studentNo: '20250003',
    studentName: '赵七',
    advisorName: '李四 教授',
    orgName: '计算机学院',
    programName: '信息与通信工程（硕士）- 2024版',
    title: '培养计划（最终稿）',
    submittedAt: '2026-01-09 16:22',
    status: 'approved',
    courses: [
      { code: 'ICE6101', name: '现代通信原理', type: 'required', credit: 3, term: '研一上' },
      { code: 'ICE6204', name: '机器学习基础', type: 'elective', credit: 3, term: '研一下' },
    ],
  },
])

function calcCredits(courses) {
  const total = courses.reduce((s, c) => s + Number(c.credit || 0), 0)
  const req = courses.filter(c => c.type === 'required').reduce((s, c) => s + Number(c.credit || 0), 0)
  const ele = total - req
  return { total, req, ele }
}

const enrichedRows = computed(() =>
    rows.value.map(r => {
      const { total, req, ele } = calcCredits(r.courses || [])
      return {
        ...r,
        creditPlanned: total,
        creditRequiredPlanned: req,
        creditElectivePlanned: ele,
      }
    })
)

const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return enrichedRows.value.filter(r => {
    const hitKw =
        !kw ||
        r.studentNo.toLowerCase().includes(kw) ||
        r.studentName.toLowerCase().includes(kw) ||
        r.title.toLowerCase().includes(kw)
    const hitStatus = !status.value || r.status === status.value
    return hitKw && hitStatus
  })
})

function statusText(s) {
  if (s === 'advisor_pending') return '待导师审核'
  if (s === 'admin_pending') return '待学院终审'
  if (s === 'approved') return '已通过'
  if (s === 'rejected') return '已退回'
  return s
}

function statusTagType(s) {
  if (s === 'advisor_pending') return 'warning'
  if (s === 'admin_pending') return 'warning'
  if (s === 'approved') return 'success'
  if (s === 'rejected') return 'danger'
  return 'info'
}

// 静态：假设当前页面“审批人角色”为导师
const operatorRole = ref('advisor') // advisor | admin
function canApprove(row) {
  if (operatorRole.value === 'advisor') return row.status === 'advisor_pending'
  if (operatorRole.value === 'admin') return row.status === 'admin_pending'
  return false
}

const drawerVisible = ref(false)
const current = reactive({
  id: null,
  studentNo: '',
  studentName: '',
  advisorName: '',
  orgName: '',
  programName: '',
  title: '',
  submittedAt: '',
  status: '',
  courses: [],
  creditPlanned: 0,
  creditRequiredPlanned: 0,
  creditElectivePlanned: 0,
})
const opinion = ref('')

const drawerTitle = computed(() => (current.id ? `计划详情：${current.studentName}（${current.studentNo}）` : '计划详情'))
const canOperateCurrent = computed(() => !!current.id && canApprove(current))

function openDetail(row) {
  const r = enrichedRows.value.find(x => x.id === row.id) || row
  Object.assign(current, JSON.parse(JSON.stringify(r)))
  opinion.value = ''
  drawerVisible.value = true
}

function quickApprove(row) {
  openDetail(row)
  approveCurrent()
}

function approveCurrent() {
  if (!canOperateCurrent.value) {
    ElMessage.warning('当前状态不可审批（演示）')
    return
  }
  // 演示：导师通过 -> 进入学院终审；学院通过 -> approved
  const idx = rows.value.findIndex(x => x.id === current.id)
  if (idx < 0) return

  if (rows.value[idx].status === 'advisor_pending') {
    rows.value[idx].status = 'admin_pending'
    ElMessage.success('导师已通过（演示）：已流转学院终审')
  } else if (rows.value[idx].status === 'admin_pending') {
    rows.value[idx].status = 'approved'
    ElMessage.success('学院已通过（演示）：培养计划生效')
  }
  drawerVisible.value = false
}

function rejectCurrent() {
  if (!canOperateCurrent.value) {
    ElMessage.warning('当前状态不可退回（演示）')
    return
  }
  const idx = rows.value.findIndex(x => x.id === current.id)
  if (idx < 0) return
  rows.value[idx].status = 'rejected'
  ElMessage.success(`已退回修改（演示）：意见="${opinion.value || '（未填写）'}"`)
  drawerVisible.value = false
}

function mockRefresh() {
  ElMessage.success('已刷新（静态演示）')
}
</script>

<style scoped>
.page-study-plan-approve {
  padding: 16px;
}
.mb-16 {
  margin-bottom: 16px;
}
.mt-12 {
  margin-top: 12px;
}
.mt-16 {
  margin-top: 16px;
}
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.toolbar .left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.section-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
