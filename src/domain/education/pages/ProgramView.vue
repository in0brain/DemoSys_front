<template>
  <div class="page-program-view">
    <el-row :gutter="16">
      <!-- 左：方案概要 -->
      <el-col :span="8">
        <el-card shadow="never" class="mb-16">
          <template #header>
            <div class="card-title">
              <span>培养方案（Program）</span>
              <el-tag type="success" effect="plain">最终版（静态）</el-tag>
            </div>
          </template>

          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="方案名称">{{ program.name }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ program.version }}</el-descriptions-item>
            <el-descriptions-item label="适用对象">{{ program.audience }}</el-descriptions-item>
            <el-descriptions-item label="学院/专业">{{ program.org }} / {{ program.major }}</el-descriptions-item>
            <el-descriptions-item label="培养层次">{{ program.level }}</el-descriptions-item>
            <el-descriptions-item label="生效日期">{{ program.effectiveDate }}</el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="kpis">
            <div class="kpi">
              <div class="kpi-title">总学分</div>
              <div class="kpi-value">{{ program.credits.total }}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">必修学分</div>
              <div class="kpi-value">{{ program.credits.required }}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">选修学分</div>
              <div class="kpi-value">{{ program.credits.elective }}</div>
            </div>
          </div>

          <el-divider />

          <div class="btns">
            <el-button type="primary" @click="mockDownload">下载培养方案PDF（演示）</el-button>
            <el-button @click="mockPrint">打印（演示）</el-button>
          </div>

          <el-alert
              class="mt-12"
              type="info"
              :closable="false"
              title="说明：此页用于展示学院发布的最终培养方案，学生填写培养计划时将以此为约束。"
          />
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div class="card-title"><span>关键规则</span></div>
          </template>

          <el-timeline>
            <el-timeline-item v-for="(r, idx) in rules" :key="idx" :timestamp="r.tag" placement="top">
              <div class="rule-title">{{ r.title }}</div>
              <div class="muted">{{ r.desc }}</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 右：课程结构 -->
      <el-col :span="16">
        <el-card shadow="never" class="mb-16">
          <template #header>
            <div class="card-title"><span>课程结构与要求</span></div>
          </template>

          <el-table :data="creditBuckets" border size="small">
            <el-table-column prop="category" label="类别" width="140" />
            <el-table-column prop="requiredCredits" label="要求学分" width="110" />
            <el-table-column prop="notes" label="说明" min-width="260" />
          </el-table>

          <el-divider />

          <div class="section-title">必修课程清单（示例）</div>
          <el-table :data="requiredCourses" border size="small" height="240">
            <el-table-column prop="code" label="课程号" width="110" />
            <el-table-column prop="name" label="课程名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="credit" label="学分" width="70" />
            <el-table-column prop="suggestedTerm" label="建议学期" width="120" />
            <el-table-column prop="ownerOrg" label="开课单位" width="140" />
          </el-table>

          <div class="muted mt-8">
            * 最终系统中：这里会来自 ProgramController / CourseController 组合数据（演示先写死）。
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div class="card-title"><span>推荐学期安排（示例）</span></div>
          </template>

          <el-row :gutter="16">
            <el-col v-for="t in termPlan" :key="t.term" :span="12" class="mb-16">
              <el-card shadow="never" class="term-card">
                <template #header>
                  <div class="term-title">
                    <span>{{ t.term }}</span>
                    <el-tag effect="plain">{{ t.totalCredits }} 学分</el-tag>
                  </div>
                </template>

                <el-table :data="t.items" size="small" border>
                  <el-table-column prop="name" label="课程/环节" min-width="180" show-overflow-tooltip />
                  <el-table-column label="类型" width="90">
                    <template #default="{ row }">
                      <el-tag :type="row.kind === 'course' ? 'info' : 'warning'" effect="plain" size="small">
                        {{ row.kind === 'course' ? '课程' : '环节' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="credit" label="学分" width="70" />
                </el-table>
              </el-card>
            </el-col>
          </el-row>

          <el-alert
              type="warning"
              :closable="false"
              title="提示：推荐学期仅供参考。学生填写培养计划时可调整学期，但必须满足学分与必修要求（后续由系统校验）。"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const program = ref({
  name: '信息与通信工程（硕士）培养方案',
  version: '2025-v1.0',
  audience: '2025级硕士研究生',
  org: '计算机学院',
  major: '信息与通信工程',
  level: '硕士',
  effectiveDate: '2025-09-01',
  credits: { total: 30, required: 18, elective: 12 },
})

const rules = ref([
  { tag: '学分要求', title: '总学分 ≥ 30', desc: '其中必修 ≥ 18，选修 ≥ 12。' },
  { tag: '课程范围', title: '原则上仅选本方案课程', desc: '跨院/跨专业课程需走特殊申请与学分认定流程（后续实现）。' },
  { tag: '流程约束', title: '培养计划通过后方可进入选课', desc: '导师审核 → 学院终审 → 生效。' },
  { tag: '时间节点', title: '入学后规定时间内提交培养计划', desc: '逾期将触发系统提醒（后续实现）。' },
])

const creditBuckets = ref([
  { category: '必修课程', requiredCredits: 12, notes: '核心理论课程，必须完成' },
  { category: '专业选修', requiredCredits: 12, notes: '方向课程，按研究方向选择' },
  { category: '公共课/环节', requiredCredits: 6, notes: '学术写作、开题/中期等培养环节' },
])

const requiredCourses = ref([
  { code: 'ICE6101', name: '现代通信原理', credit: 3, suggestedTerm: '研一上', ownerOrg: '计算机学院' },
  { code: 'ICE6102', name: '数字信号处理', credit: 3, suggestedTerm: '研一上', ownerOrg: '计算机学院' },
  { code: 'ICE6103', name: '随机过程与应用', credit: 3, suggestedTerm: '研一下', ownerOrg: '计算机学院' },
  { code: 'ICE6104', name: '学术写作与规范', credit: 2, suggestedTerm: '研一上', ownerOrg: '研究生院' },
  { code: 'ICE6105', name: '科研伦理与学术规范', credit: 1, suggestedTerm: '研一下', ownerOrg: '研究生院' },
])

const termPlan = ref([
  {
    term: '研一上',
    totalCredits: 8,
    items: [
      { kind: 'course', name: '现代通信原理', credit: 3 },
      { kind: 'course', name: '数字信号处理', credit: 3 },
      { kind: 'course', name: '学术写作与规范', credit: 2 },
    ],
  },
  {
    term: '研一下',
    totalCredits: 7,
    items: [
      { kind: 'course', name: '随机过程与应用', credit: 3 },
      { kind: 'course', name: '机器学习基础（选修）', credit: 3 },
      { kind: 'course', name: '科研伦理与学术规范', credit: 1 },
    ],
  },
  {
    term: '研二上',
    totalCredits: 8,
    items: [
      { kind: 'course', name: '信息论与编码（选修）', credit: 3 },
      { kind: 'course', name: '嵌入式系统设计（选修）', credit: 2 },
      { kind: 'milestone', name: '中期考核', credit: 3 },
    ],
  },
  {
    term: '研二下',
    totalCredits: 7,
    items: [
      { kind: 'milestone', name: '预答辩/论文修改', credit: 4 },
      { kind: 'course', name: '方向选修课（自选）', credit: 3 },
    ],
  },
])

function mockDownload() {
  ElMessage.success('下载成功（演示）：后续接入文件中心/导出服务')
}
function mockPrint() {
  ElMessage.info('已触发打印（演示）：后续接入 window.print 或服务端渲染PDF')
}
</script>

<style scoped>
.page-program-view {
  padding: 16px;
}
.mb-16 {
  margin-bottom: 16px;
}
.mt-12 {
  margin-top: 12px;
}
.mt-8 {
  margin-top: 8px;
}
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
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
  font-size: 20px;
  font-weight: 800;
  margin-top: 4px;
}
.btns {
  display: flex;
  gap: 8px;
}
.section-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.rule-title {
  font-weight: 600;
}
.term-card {
  border-radius: 10px;
}
.term-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
