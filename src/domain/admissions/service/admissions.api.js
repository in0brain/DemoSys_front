// src/domain/admissions/service/admissions.api.js
import { httpUnwrap } from '@/common/http'

// 1) 候选人列表（分页）
export function getCandidates({ page = 1, pageSize = 10 } = {}) {
    return httpUnwrap.get('/admissions/candidates', {
        params: { page, pageSize }
    })
}

// 2) 录入复试成绩
export function submitInterviewScore(candidateId, { score }) {
    return httpUnwrap.put(
        `/admissions/candidates/${candidateId}/interview-score`,
        { score }
    )
}

// 2.1) 复试成绩列表（联表：candidate + score）
// GET /admissions/interview-scores?page&pageSize
export function getInterviewScores({ page = 1, pageSize = 10 } = {}) {
    return httpUnwrap.get('/admissions/interview-scores', {
        params: { page, pageSize }
    })
}

// 3) 生成拟录取草稿
export function createOfferDraft() {
    return httpUnwrap.post('/admissions/offers/drafts')
}

// 4) 发布拟录取公示
export function publishOfferDraft(draftId) {
    return httpUnwrap.post(`/admissions/offers/drafts/${draftId}/publish`)
}

// 5) 公示查询（公开）
export function queryPublicOffers(keyword) {
    const kw = (keyword ?? '').trim()
    return httpUnwrap.get('/public/admissions/offers', {
        params: {
            'filters[keyword]': kw,
            keyword: kw,
        }
    })
}

// 5.1) 公示查询（默认展示全部已公示）
// 约定：keyword="__ALL_PUBLISHED__" 表示“仅返回已公示列表”
export function listPublishedOffers() {
    return queryPublicOffers('__ALL_PUBLISHED__')
}

// 6) 加入拟录取草稿名单（单个考生）
export function addCandidateToOfferDraft(candidateId) {
    return httpUnwrap.post('/admissions/offers/drafts/items', {
        candidateId
    })
}

// 3.1) 查询拟录取草稿（不传 draftId）
export function getOfferDraft(draftId) {
    const id = String(draftId ?? '').trim()
    if (!id) {
        // 不传 draftId：查草稿表全部（或最新）
        return httpUnwrap.get('/admissions/offers/drafts', {
            params: { draftId: '' }
        })
    }
    return httpUnwrap.get(`/admissions/offers/drafts/${id}`)
}

// 3.2) 拟录取草稿条目列表
// GET /admissions/offers/drafts/items
export function listOfferDraftItems() {
    return httpUnwrap.get('/admissions/offers/drafts/items')
}

// 6.2) 批量加入拟录取草稿
export function addCandidatesToOfferDraftBatch(candidateIds, draftId) {
    return httpUnwrap.post('/admissions/offers/drafts/items/batch', {
        candidateIds: candidateIds || [],
        draftId: draftId || ''
    })
}
