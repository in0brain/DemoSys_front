<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="header">
          <div class="title">考生列表</div>
          <div class="actions">
            <el-button type="primary" @click="load">刷新</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" label-width="80px">
        <el-form-item label="关键字">
          <el-input v-model="keyword" placeholder="姓名 / 考号" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe style="width: 100%; margin-top: 12px">
        <el-table-column prop="examNo" label="考号" width="180" />
        <el-table-column prop="name" label="姓名" width="140" />

        <!-- ✅ 现在后端已返回 major：展示 row.major，空则 '-' -->
        <el-table-column prop="major" label="报考专业" min-width="180">
          <template #default="{ row }">
            <span v-if="row.major && String(row.major).trim()">{{ row.major }}</span>
            <span v-else style="color:#999;">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="interviewLocked" label="状态" width="140">
          <template #default="{ row }">
            <el-tag v-if="!isLocked(row)" type="info">未录入</el-tag>
            <el-tag v-else type="success">已锁定</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
                type="primary"
                link
                :disabled="isLocked(row)"
                @click="goScoreEntry(row)"
            >
              进入录入页
            </el-button>
            <el-button type="danger" link disabled>清空（未实现）</el-button>
          </template>
        </el-table-column>

      </el-table>

      <div class="pager">
        <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            :page-sizes="[10, 20, 50]"
            @size-change="onSizeChange"
            @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { getCandidates } from '@/domain/admissions/service/admissions.api'

const router = useRouter()

const keyword = ref('')
const tableData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const route = useRoute()

function isLocked(row) {
  const v = row?.interviewLocked
  return v === true || v === 1 || v === '1'
}

watch(
    () => route.query.refresh,
    (v) => {
      if (v === '1') {
        load()
        router.replace({ path: route.path, query: {} })
      }
    },
    { immediate: true }
)


async function load() {
  try {
    // 你后端还没做 keyword 过滤：先不传 keyword（保留 UI）
    const resp = await getCandidates({ page: page.value, pageSize: pageSize.value })

    console.log('[getCandidates resp]', resp)
    tableData.value = resp?.items ?? []
    total.value = resp?.total ?? 0
    page.value = resp?.page ?? page.value
    pageSize.value = resp?.pageSize ?? pageSize.value
  } catch (e) {
    ElMessage.error(e?.message || '加载失败')
  }
}

function onSearch() {
  page.value = 1
  load()
}

function onReset() {
  keyword.value = ''
  page.value = 1
  load()
}

function onSizeChange(ps) {
  pageSize.value = ps
  page.value = 1
  load()
}

function onPageChange(p) {
  page.value = p
  load()
}

function goScoreEntry(row) {
  router.push({
    path: `/admissions/interview-scores/${row.id}`,
    query: { name: row.name, examNo: row.examNo, major: row.major || '' }
  })
}

onMounted(load)
</script>

<style scoped>
.page { padding: 16px; }
.header { display: flex; align-items: center; justify-content: space-between; }
.title { font-size: 16px; font-weight: 600; }
.pager { display: flex; justify-content: flex-end; margin-top: 14px; }
</style>
