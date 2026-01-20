<template>
  <div class="page-offer-publish">
    <el-card shadow="never" class="mb-16">
      <div class="header">
        <div>
          <div class="title">拟录取发布确认</div>
          <div class="sub">当前展示：拟录取草稿表（全表）</div>
        </div>
        <el-button @click="goBack">返回草稿</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-alert
          title="发布后将写入公示表，公众查询将显示为已公示（offered=1）"
          type="warning"
          show-icon
          class="mb-16"
      />

      <div class="toolbar2">
        <el-button :loading="loadingDraft" @click="loadDraft">
          刷新草稿
        </el-button>
      </div>

      <!-- ✅ 全表草稿明细 -->
      <el-table
          :data="draftItems"
          border
          stripe
          style="width: 100%"
          v-loading="loadingDraft"
      >
        <el-table-column prop="draftId" label="草稿批次" min-width="220" />
        <el-table-column prop="candidateId" label="考生ID" width="120" />
        <el-table-column prop="examNo" label="考号" width="160" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="major" label="报考专业" min-width="180">
          <template #default="{ row }">
            <span v-if="row.major && String(row.major).trim()">{{ row.major }}</span>
            <span v-else style="color:#999;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="admitFlag" label="拟录取" width="110">
          <template #default="{ row }">
            <el-tag v-if="Number(row.admitFlag) === 1" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
          v-if="!loadingDraft && draftItems.length === 0"
          description="草稿表暂无数据（请先从成绩页勾选加入拟录取草稿）"
      />

      <div class="footer">
        <el-button
            type="primary"
            :loading="publishing"
            :disabled="!publishDraftId"
            @click="publish"
        >
          确认发布
        </el-button>

        <div class="tip" v-if="!publishDraftId">
          ⚠️ 无法发布：草稿表为空，或没有 draftId（草稿批次）可发布。
        </div>

        <div class="tip" v-else>
          将发布批次：<b>{{ publishDraftId }}</b>（默认取当前列表第一条的 draftId）
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { publishOfferDraft, listOfferDraftItems } from '@/domain/admissions/service/admissions.api'

export default {
  name: 'OfferPublish',
  data() {
    return {
      draftItems: [],
      loadingDraft: false,
      publishing: false,
    }
  },
  computed: {
    // ✅ 全表模式下：发布用 draftId 从列表里“自动取一个”
    // 最简单：取第一条的 draftId（你当前策略通常只有一批）
    publishDraftId() {
      const first = this.draftItems?.[0]
      const id = first?.draftId
      return id ? String(id) : ''
    }
  },
  created() {
    this.loadDraft()
  },
  methods: {
    async loadDraft() {
      this.loadingDraft = true
      try {
        // ✅ 后端应返回：items[]（全表）
        const items = await listOfferDraftItems()
        this.draftItems = Array.isArray(items) ? items : (items?.items ?? [])
      } catch (e) {
        this.$message.error(e.message || '加载草稿失败')
        this.draftItems = []
      } finally {
        this.loadingDraft = false
      }
    },

    async publish() {
      const draftId = this.publishDraftId
      if (!draftId) return

      try {
        await this.$confirm(
            `确认发布该拟录取名单？\n批次：${draftId}`,
            '发布确认',
            { type: 'warning' }
        )
      } catch (_) {
        return
      }

      this.publishing = true
      try {
        const data = await publishOfferDraft(draftId)
        if (data?.published === false) {
          this.$message.warning('发布未完成')
          return
        }
        this.$message.success('发布成功')
      } catch (e) {
        this.$message.error(e.message || '发布失败')
      } finally {
        this.publishing = false
      }
    },

    goBack() {
      this.$router.push('/admissions/offer-draft')
    }
  }
}
</script>

<style scoped>
.page-offer-publish { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 16px; font-weight: 600; }
.sub { color: #909399; margin-top: 4px; }
.toolbar2 { margin-bottom: 12px; display:flex; justify-content:flex-end; }
.footer { margin-top: 16px; text-align: right; }
.tip { margin-top: 8px; color: #909399; font-size: 12px; text-align: left; }
.mb-16 { margin-bottom: 16px; }
</style>
