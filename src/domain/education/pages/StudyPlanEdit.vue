<template>
  <div class="page-study-plan-edit">
    <el-row :gutter="16">
      <!-- 左侧：学生与状态 -->
      <el-col :span="8">
        <el-card shadow="never" class="mb-16">
          <template #header>
            <div class="card-title">
              <span>培养计划填写</span>
              <el-tag type="info" effect="plain">静态演示</el-tag>
            </div>
          </template>

          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="学生姓名">{{ student.name }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ student.studentNo }}</el-descriptions-item>
            <el-descriptions-item label="学院/专业">{{ student.org }} / {{ student.major }}</el-descriptions-item>
            <el-descriptions-item label="培养层次">{{ student.level }}</el-descriptions-item>
            <el-descriptions-item label="导师">{{ student.advisor }}</el-descriptions-item>
          </el-descriptions>

          <div class="mt-16">
            <div class="label">流程状态</div>
            <el-steps :active="stepActive" finish-status="success" align-center>
              <el-step title="填写计划" description="选择课程/学期" />
              <el-step title="提交导师审核" description="等待导师审批" />
              <el-step title="学院终审" description="培养秘书确认" />
              <el-step title="生效" description="可进入选课" />
            </el-steps>
          </div>

          <el-alert
              class="mt-16"
              type="info"
              :closable="false"
              title="提示：此页面为静态稿。后续接入接口后，将从培养方案/课程库拉取数据，提交后进入审批流程。"
          />
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div class="card-title"><span>学分要求概览</span></div>
          </template>

          <el-row :gutter="12">
            <el-col :span="12">
              <div class="kpi">
                <div class="kpi-title">总学分要求</div>
                <div class="kpi-value">{{ requirements.total }} 学分</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="kpi">
                <div class="kpi-title">已规划</div>
                <div class="kpi-value">{{ totalPlannedCredits }} 学分</div>
              </div>
            </el-col>

            <el-col :span="12">
              <div class="kpi">
                <div class="kpi-title">必修要求</div>
                <div class="kpi-value">{{ requirements.required }} 学分</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="kpi">
                <div class="kpi-title">必修已规划</div>
                <div class="kpi-value">{{ plannedCreditsByType.required }} 学分</div>
              </div>
            </el-col>

            <el-col :span="12">
              <div class="kpi">
                <div class="kpi-title">选修要求</div>
                <div class="kpi-value">{{ requirements.elective }} 学分</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="kpi">
                <div class="kpi-title">选修已规划</div>
                <div class="kpi-value">{{ plannedCreditsByType.elective }} 学分</div>
              </div>
            </el-col>
          </el-row>

          <el-divider />

          <el-progress
              :percentage="progressPct"
              :status="progressPct >= 100 ? 'success' : ''"
              :stroke-width="10"
          />
          <div class="muted mt-8">
            进度 = 已规划总学分 / 总学分要求（仅演示，不含培养环节）
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：计划表单 + 课程选择 -->
      <el-col :span="16">
        <el-card shadow="never" class="mb-16">
          <template #header>
            <div class="card-title"><span>计划基本信息</span></div>
          </template>

          <el-form :model="planMeta" label-width="110px" class="form">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="计划名称">
                  <el-input v-model="planMeta.title" placeholder="例如：2025级硕士培养计划（第一版）" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所属培养方案">
                  <el-select v-model="planMeta.programName" style="width: 100%">
                    <el-option label="信息与通信工程（硕士）- 2025版" value="信息与通信工程（硕士）- 2025版" />
                    <el-option label="信息与通信工程（硕士）- 2024版" value="信息与通信工程（硕士）- 2024版" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="计划学年">
                  <el-select v-model="planMeta.year" style="width: 100%">
                    <el-option label="2025-2026" value="2025-2026" />
                    <el-option label="2026-2027" value="2026-2027" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="备注">
                  <el-input v-model="planMeta.remark" placeholder="可选：跨院课程、替代规则说明等" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <el-divider />

          <div class="toolbar">
            <div class="left">
              <el-input
                  v-model="courseKeyword"
                  placeholder="搜索课程名/课程号"
                  clearable
                  style="width: 280px"
              />
              <el-select v-model="courseTypeFilter" style="width: 160px" clearable placeholder="课程类别">
                <el-option label="必修" value="required" />
                <el-option label="选修" value="elective" />
              </el-select>
              <el-select v-model="courseTermFilter" style="width: 160px" clearable placeholder="建议学期">
                <el-option v-for="t in terms" :key="t" :label="t" :value="t" />
              </el-select>
            </div>

            <div class="right">
              <el-button @click="resetDraft">重置草稿</el-button>
              <el-button type="primary" @click="submitPlan">提交导师审核</el-button>
            </div>
          </div>

          <el-alert
              class="mt-12"
              type="warning"
              :closable="false"
              title="演示规则：仅允许添加培养方案内课程；后续接入接口后将做学期冲突、学分上限、跨院规则等校验。"
          />
        </el-card>

        <el-row :gutter="16">
          <!-- 可选课程 -->
          <el-col :span="12">
            <el-card shadow="never" class="h-100">
              <template #header>
                <div class="card-title">
                  <span>可选课程（静态）</span>
                  <el-tag type="info" effect="plain">{{ filteredCourses.length }} 门</el-tag>
                </div>
              </template>

              <el-table :data="filteredCourses" size="small" border height="420">
                <el-table-column prop="code" label="课程号" width="110" />
                <el-table-column prop="name" label="课程名称" min-width="160" show-overflow-tooltip />
                <el-table-column label="类别" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.type === 'required' ? 'danger' : 'success'" effect="plain" size="small">
                      {{ row.type === 'required' ? '必修' : '选修' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="credit" label="学分" width="70" />
                <el-table-column prop="term" label="建议学期" width="110" />
                <el-table-column label="操作" width="90" fixed="right">
                  <template #default="{ row }">
                    <el-button
                        type="primary"
                        link
                        :disabled="plannedIds.has(row.id)"
                        @click="addCourse(row)"
                    >
                      添加
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <div class="muted mt-8">
                * 课程数据后续将来自课程库接口（CourseController）。
              </div>
            </el-card>
          </el-col>

          <!-- 已规划课程 -->
          <el-col :span="12">
            <el-card shadow="never" class="h-100">
              <template #header>
                <div class="card-title">
                  <span>已规划课程</span>
                  <el-tag :type="progressPct >= 100 ? 'success' : 'info'" effect="plain">
                    {{ totalPlannedCredits }} / {{ requirements.total }} 学分
                  </el-tag>
                </div>
              </template>

              <el-table :data="plannedCourses" size="small" border height="420">
                <el-table-column prop="code" label="课程号" width="110" />
                <el-table-column prop="name" label="课程名称" min-width="160" show-overflow-tooltip />
                <el-table-column label="类别" width="80">
                  <template #default="{ row }">
                    <el-tag :type="row.type === 'required' ? 'danger' : 'success'" effect="plain" size="small">
                      {{ row.type === 'required' ? '必修' : '选修' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="credit" label="学分" width="70" />
                <el-table-column label="学期" width="140">
                  <template #default="{ row }">
                    <el-select v-model="row.term" size="small" style="width: 120px">
                      <el-option v-for="t in terms" :key="t" :label="t" :value="t" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="90" fixed="right">
                  <template #default="{ row }">
                    <el-button type="danger" link @click="removeCourse(row)">移除</el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-divider />

              <el-row :gutter="12">
                <el-col :span="12">
                  <el-statistic title="必修已规划" :value="plannedCreditsByType.required" />
                </el-col>
                <el-col :span="12">
                  <el-statistic title="选修已规划" :value="plannedCreditsByType.elective" />
                </el-col>
              </el-row>

              <div class="muted mt-8">
                * 学期可编辑仅用于演示；真实逻辑会做冲突检查。
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="mt-16">
          <template #header>
            <div class="card-title"><span>培养环节（静态占位）</span></div>
          </template>

          <el-table :data="milestones" size="small" border>
            <el-table-column prop="name" label="环节" />
            <el-table-column prop="targetTerm" label="建议学期" width="140" />
            <el-table-column prop="requirement" label="要求" min-width="220" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'planned' ? 'info' : 'success'" effect="plain">
                  {{ row.status === 'planned' ? '未完成' : '已完成' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="muted mt-8">
            * 培养环节后续将与开题/中期/毕业资格等模块联动。
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const student = reactive({
  name: '张三',
  studentNo: '20250001',
  org: '计算机学院',
  major: '信息与通信工程',
  level: '硕士',
  advisor: '李四 教授',
})

const stepActive = ref(0)

const requirements = reactive({
  total: 30,
  required: 18,
  elective: 12,
})

const planMeta = reactive({
  title: '2025级硕士培养计划（草稿）',
  programName: '信息与通信工程（硕士）- 2025版',
  year: '2025-2026',
  remark: '',
})

const terms = ['研一上', '研一下', '研二上', '研二下']

const allCourses = ref([
  { id: 1, code: 'ICE6101', name: '现代通信原理', type: 'required', credit: 3, term: '研一上' },
  { id: 2, code: 'ICE6102', name: '数字信号处理', type: 'required', credit: 3, term: '研一上' },
  { id: 3, code: 'ICE6103', name: '随机过程与应用', type: 'required', credit: 3, term: '研一下' },
  { id: 4, code: 'ICE6201', name: '雷达系统与信号处理', type: 'elective', credit: 3, term: '研一下' },
  { id: 5, code: 'ICE6202', name: '信息论与编码', type: 'elective', credit: 3, term: '研二上' },
  { id: 6, code: 'ICE6203', name: '嵌入式系统设计', type: 'elective', credit: 2, term: '研二上' },
  { id: 7, code: 'ICE6104', name: '学术写作与规范', type: 'required', credit: 2, term: '研一上' },
  { id: 8, code: 'ICE6204', name: '机器学习基础', type: 'elective', credit: 3, term: '研一下' },
])

const plannedCourses = ref([
  { id: 1, code: 'ICE6101', name: '现代通信原理', type: 'required', credit: 3, term: '研一上' },
  { id: 2, code: 'ICE6102', name: '数字信号处理', type: 'required', credit: 3, term: '研一上' },
  { id: 7, code: 'ICE6104', name: '学术写作与规范', type: 'required', credit: 2, term: '研一上' },
  { id: 4, code: 'ICE6201', name: '雷达系统与信号处理', type: 'elective', credit: 3, term: '研一下' },
])

const milestones = ref([
  { name: '开题报告', targetTerm: '研一下', requirement: '提交开题材料并通过评审', status: 'planned' },
  { name: '中期考核', targetTerm: '研二上', requirement: '完成中期检查/阶段成果汇报', status: 'planned' },
  { name: '预答辩', targetTerm: '研二下', requirement: '学院组织预答辩/修改意见', status: 'planned' },
])

const courseKeyword = ref('')
const courseTypeFilter = ref('')
const courseTermFilter = ref('')

const plannedIds = computed(() => new Set(plannedCourses.value.map(x => x.id)))

const filteredCourses = computed(() => {
  const kw = courseKeyword.value.trim().toLowerCase()
  return allCourses.value.filter(c => {
    if (plannedIds.value.has(c.id)) return false
    const hitKw = !kw || c.name.toLowerCase().includes(kw) || c.code.toLowerCase().includes(kw)
    const hitType = !courseTypeFilter.value || c.type === courseTypeFilter.value
    const hitTerm = !courseTermFilter.value || c.term === courseTermFilter.value
    return hitKw && hitType && hitTerm
  })
})

const totalPlannedCredits = computed(() =>
    plannedCourses.value.reduce((sum, c) => sum + Number(c.credit || 0), 0)
)

const plannedCreditsByType = computed(() => {
  const res = { required: 0, elective: 0 }
  for (const c of plannedCourses.value) {
    if (c.type === 'required') res.required += Number(c.credit || 0)
    else res.elective += Number(c.credit || 0)
  }
  return res
})

const progressPct = computed(() => {
  const pct = Math.round((totalPlannedCredits.value / requirements.total) * 100)
  return Math.min(100, Math.max(0, pct))
})

function addCourse(row) {
  plannedCourses.value.push({ ...row })
  ElMessage.success(`已添加：${row.name}`)
}

function removeCourse(row) {
  plannedCourses.value = plannedCourses.value.filter(x => x.id !== row.id)
  ElMessage.info(`已移除：${row.name}`)
}

function resetDraft() {
  ElMessageBox.confirm('确认重置草稿？将恢复到演示默认课程。', '提示', { type: 'warning' })
      .then(() => {
        plannedCourses.value = [
          { id: 1, code: 'ICE6101', name: '现代通信原理', type: 'required', credit: 3, term: '研一上' },
          { id: 2, code: 'ICE6102', name: '数字信号处理', type: 'required', credit: 3, term: '研一上' },
          { id: 7, code: 'ICE6104', name: '学术写作与规范', type: 'required', credit: 2, term: '研一上' },
          { id: 4, code: 'ICE6201', name: '雷达系统与信号处理', type: 'elective', credit: 3, term: '研一下' },
        ]
        ElMessage.success('已重置')
      })
      .catch(() => {})
}

function submitPlan() {
  // 静态演示：仅做提示 + 更新 step
  if (!planMeta.title.trim()) {
    ElMessage.warning('请填写计划名称')
    return
  }
  if (totalPlannedCredits.value <= 0) {
    ElMessage.warning('请至少添加一门课程')
    return
  }
  stepActive.value = 1
  ElMessage.success('已提交（静态演示）：进入“等待导师审核”')
}
</script>

<style scoped>
.page-study-plan-edit {
  padding: 16px;
}
.mb-16 {
  margin-bottom: 16px;
}
.mt-16 {
  margin-top: 16px;
}
.mt-12 {
  margin-top: 12px;
}
.mt-8 {
  margin-top: 8px;
}
.h-100 {
  height: 100%;
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
.label {
  font-weight: 600;
  margin-bottom: 8px;
}
.kpi {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 10px 12px;
}
.kpi-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.kpi-value {
  font-size: 18px;
  font-weight: 700;
  margin-top: 4px;
}
.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
