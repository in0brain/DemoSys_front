<template>
  <div class="page-offer-draft">
    <el-card shadow="never" class="mb-16">
      <div class="toolbar">
        <el-button type="primary" :loading="loading" @click="loadInterviewScores">
          刷新复试成绩
        </el-button>

        <el-button
            type="success"
            :disabled="selectedRows.length === 0"
            @click="addSelectedToDraft"
        >
          加入拟录取草稿（{{ selectedRows.length }}）
        </el-button>

        <span class="draft-id" v-if="draftId">
          当前草稿批次：<b>{{ draftId }}</b>
        </span>
      </div>

      <el-alert
          title="当前页面展示：已录入的复试成绩（admissions_interview_score 联表 admissions_candidate）。勾选后加入拟录取草稿。"
          type="info"
          :closable="false"
          style="margin-top: 12px"
      />
    </el-card>

    <el-card shadow="never">
      <el-table
          :data="scoreItems"
          border
          style="width: 100%"
          v-loading="loading"
          @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="candidateId" label="考生ID" width="120" />
        <el-table-column prop="examNo" label="考号" width="160" />
        <el-table-column prop="name" label="姓名" width="120" />

        <el-table-column prop="major" label="报考专业" min-width="180">
          <template #default="{ row }">
            <span v-if="row.major && String(row.major).trim()">{{ row.major }}</span>
            <span v-else style="color:#999;">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="score" label="复试成绩" width="120" />
      </el-table>

      <el-empty
          v-if="!loading && scoreItems.length === 0"
          description="暂无复试成绩数据"
      />
    </el-card>
  </div>
</template>

<script>
import { getInterviewScores, addCandidatesToOfferDraftBatch }
  from '@/domain/admissions/service/admissions.api'

export default {
  name: 'OfferDraft',
  data() {
    return {
      loading: false,
      draftId: '',
      scoreItems: [],
      selectedRows: [],
      page: 1,
      pageSize: 20,
      total: 0,
    }
  },

  created() {
    this.loadInterviewScores()
  },

  methods: {
    async loadInterviewScores() {
      this.loading = true
      try {
        const data = await getInterviewScores({
          page: this.page,
          pageSize: this.pageSize
        })

        this.scoreItems = Array.isArray(data?.items) ? data.items : []
        this.total = Number(data?.total ?? 0)
        this.page = Number(data?.page ?? this.page)
        this.pageSize = Number(data?.pageSize ?? this.pageSize)

        this.selectedRows = []
      } catch (e) {
        this.$message.error(e?.message || '加载复试成绩失败')
      } finally {
        this.loading = false
      }
    },

    onSelectionChange(rows) {
      this.selectedRows = Array.isArray(rows) ? rows : []
    },

    // ✅ 真正加入拟录取草稿（批量）
    async addSelectedToDraft() {
      if (this.selectedRows.length === 0) return

      const candidateIds = this.selectedRows.map(r => r.candidateId)

      try {
        await this.$confirm(
            `确认将 ${candidateIds.length} 名考生加入拟录取草稿？`,
            '操作确认',
            { type: 'warning' }
        )
      } catch (_) {
        return
      }

      this.loading = true
      try {
        const resp = await addCandidatesToOfferDraftBatch(
            candidateIds,
            this.draftId // 可能为空，后端会自动生成
        )

        // ✅ 后端返回 draftId，必须用它
        this.draftId = resp?.draftId || this.draftId

        this.$message.success(
            `成功加入 ${resp?.inserted ?? candidateIds.length} 人到拟录取草稿`
        )

        // 清空选择（避免重复点击）
        this.selectedRows = []
      } catch (e) {
        this.$message.error(e?.message || '加入拟录取草稿失败')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>


<style scoped>
.page-offer-draft { padding: 16px; }
.toolbar { display: flex; align-items: center; gap: 12px; }
.draft-id { margin-left: auto; color: #606266; }
.mb-16 { margin-bottom: 16px; }
</style>
