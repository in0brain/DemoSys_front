<template>
  <div class="page">
    <el-card shadow="never" class="mb-12">
      <div class="toolbar">
        <div>
          <h2 style="margin:0;">学分总览（学院视角）</h2>
          <div class="hint">
            批量查看全体学生累计已通过学分（仅统计学院终审通过），默认从低到高排序，为后续预警迭代铺垫。
          </div>
        </div>

        <div class="right">
          <el-input
              v-model="keyword"
              placeholder="搜索：学号/姓名"
              style="width:240px;"
              clearable
              @keyup.enter="load"
          />
          <el-button :loading="loading" @click="load">刷新</el-button>
          <el-button type="danger" plain @click="reset">清空筛选</el-button>
        </div>
      </div>

      <el-alert
          title="SR极简：仅展示累计学分与已通过课程；不做预警逻辑/阈值配置（下轮迭代再加）。"
          type="info"
          :closable="false"
          style="margin-top:12px;"
      />
    </el-card>

    <el-row :gutter="12" class="mb-12">
      <el-col :span="8">
        <el-card shadow="never">
          <div class="kpi">
            <div class="kpi-title">学生总数</div>
            <div class="kpi-value">{{ filteredRows.length }}</div>
            <div class="kpi-sub">当前筛选结果</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="kpi">
            <div class="kpi-title">最低学分</div>
            <div class="kpi-value">{{ minCredit }}</div>
            <div class="kpi-sub">用于后续预警/关注列表</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="kpi">
            <div class="kpi-title">最高学分</div>
            <div class="kpi-value">{{ maxCredit }}</div>
            <div class="kpi-sub">用于后续分布统计</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>学生学分列表（默认：学分从低到高）</span>
          <el-tag type="info">点击“查看明细”可看已通过课程</el-tag>
        </div>
      </template>

      <el-table :data="filteredRows" border style="width:100%;" v-loading="loading">
        <el-table-column prop="studentId" label="学号/ID" width="140" />
        <el-table-column prop="studentName" label="姓名" width="140" />
        <el-table-column prop="totalCredit" label="累计已通过学分" width="160" sortable />
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
                size="small"
                :loading="detailLoading && String(detailStudent.studentId)===String(row.studentId)"
                @click="openDetail(row)"
            >
              查看明细
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && filteredRows.length===0" style="padding:16px;color:#999;">
        无数据：请调整筛选条件或刷新。
      </div>
    </el-card>

    <!-- 明细弹窗 -->
    <el-dialog v-model="detailVisible" title="已通过课程明细" width="820px">
      <div style="margin-bottom:8px;color:#666;">
        学生：<b>{{ detailStudent.studentName }}</b>（{{ detailStudent.studentId }}）
        <span style="margin-left:12px;">累计学分：<b>{{ detailStudent.totalCredit }}</b></span>
      </div>

      <el-table :data="detailCourses" border style="width:100%;" v-loading="detailLoading">
        <el-table-column prop="courseCode" label="课程编号" width="140" />
        <el-table-column prop="courseName" label="课程名称" min-width="220" />
        <el-table-column prop="credit" label="学分" width="90" />
        <!-- ⚠️ 对齐后端：fromEnrollmentId -->
        <el-table-column prop="fromEnrollmentId" label="来源申请ID" width="190" />
        <el-table-column prop="approvedTime" label="通过时间" width="170" />
      </el-table>

      <template #footer>
        <el-button @click="detailVisible=false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCreditsOverview, getCreditsByStudentId } from '@/domain/education/service/education.api'

const keyword = ref('')
const loading = ref(false)
const rows = ref([])

async function load() {
  loading.value = true
  try {
    const resp = await getCreditsOverview({ keyword: keyword.value })
    if (resp?.code !== 0) {
      ElMessage.error(resp?.message || '加载失败')
      rows.value = []
      return
    }
    // ✅ 关键：你的后端是 { data: { items: [...] } }
    rows.value = Array.isArray(resp?.data?.items) ? resp.data.items : []
  } catch (e) {
    ElMessage.error(e?.message || '网络错误')
    rows.value = []
  } finally {
    loading.value = false
  }
}

const filteredRows = computed(() => {
  const kw = (keyword.value || '').trim().toLowerCase()
  let list = rows.value.slice()

  // 前端再做一层过滤（后端 keyword 你可先不实现，这层保证可用）
  if (kw) {
    list = list.filter(x =>
        String(x.studentId ?? '').includes(kw) ||
        String(x.studentName ?? '').toLowerCase().includes(kw)
    )
  }

  // 默认：学分从低到高
  list.sort((a, b) => {
    const ac = Number(a.totalCredit || 0)
    const bc = Number(b.totalCredit || 0)
    if (ac !== bc) return ac - bc
    return String(a.studentId).localeCompare(String(b.studentId))
  })

  return list
})

const minCredit = computed(() => {
  if (filteredRows.value.length === 0) return 0
  return Math.min(...filteredRows.value.map(x => Number(x.totalCredit || 0)))
})
const maxCredit = computed(() => {
  if (filteredRows.value.length === 0) return 0
  return Math.max(...filteredRows.value.map(x => Number(x.totalCredit || 0)))
})

/** 明细弹窗（真实接口） */
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailStudent = ref({ studentId: '', studentName: '', totalCredit: 0 })
const detailCourses = ref([])

async function openDetail(row) {
  detailStudent.value = { ...row }
  detailCourses.value = []
  detailVisible.value = true
  detailLoading.value = true

  try {
    const resp = await getCreditsByStudentId(row.studentId)
    if (resp?.code !== 0) {
      ElMessage.error(resp?.message || '加载明细失败')
      return
    }

    const data = resp.data || {}
    if (typeof data.totalCredit !== 'undefined') {
      detailStudent.value.totalCredit = data.totalCredit
    }
    detailCourses.value = Array.isArray(data.passedCourses) ? data.passedCourses : []
  } catch (e) {
    ElMessage.error(e?.message || '网络错误')
  } finally {
    detailLoading.value = false
  }
}

function reset() {
  keyword.value = ''
  load()
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
.kpi-value { font-size: 28px; font-weight: 700; margin-top: 6px; }
.kpi-sub { color:#999; font-size:12px; margin-top: 8px; }
</style>
