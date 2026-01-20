// src/domain/admissions/service/admissions.api.js
import http from '@/common/http'

// 兼容：
// 1) ApiResponse: {code,message,data} 且成功 code=0（你的 ApiCode.SUCCESS=0）
// 2) 直接返回 data（没有 code 字段）
function unwrapResp(resp) {
    if (resp && typeof resp.code === 'number') {
        if (resp.code === 0) return resp.data
        throw new Error(resp.message || '请求失败')
    }
    return resp
}

async function unwrap(promise) {
    try {
        const resp = await promise
        return unwrapResp(resp)
    } catch (err) {
        const msg =
            err?.response?.data?.message ||
            err?.message ||
            '请求失败'
        throw new Error(msg)
    }
}

// 1) 候选人列表（分页）
export function getCandidates({ page = 1, pageSize = 10 } = {}) {
    return unwrap(http.get('/admissions/candidates', { params: { page, pageSize } }))
}

// 2) 录入复试成绩
export function submitInterviewScore(candidateId, { score }) {
    return unwrap(http.put(`/admissions/candidates/${candidateId}/interview-score`, { score }))
}
// 2.1) 复试成绩列表（联表：candidate + score）
// GET /admissions/interview-scores?page&pageSize
export function getInterviewScores({ page = 1, pageSize = 10 } = {}) {
    return unwrap(http.get('/admissions/interview-scores', { params: { page, pageSize } }))
}

// 3) 生成拟录取草稿
export function createOfferDraft() {
    return unwrap(http.post('/admissions/offers/drafts'))
}

// 4) 发布拟录取公示
export function publishOfferDraft(draftId) {
    return unwrap(http.post(`/admissions/offers/drafts/${draftId}/publish`))
}

// 5) 公示查询（公开）
export function queryPublicOffers(keyword) {
    const kw = (keyword ?? '').trim()
    return unwrap(
        http.get('/public/admissions/offers', {
            params: {
                'filters[keyword]': kw,
                keyword: kw,
            },
        })
    )
}

// 5.1) 公示查询（默认展示全部已公示）
// 约定：keyword="__ALL_PUBLISHED__" 表示“仅返回已公示列表”
export function listPublishedOffers() {
    return queryPublicOffers('__ALL_PUBLISHED__')
}

// 6) 加入拟录取草稿名单（单个考生）
export function addCandidateToOfferDraft(candidateId) {
    return unwrap(http.post('/admissions/offers/drafts/items', { candidateId }))
}


export function getOfferDraft(draftId) {
    const id = String(draftId ?? '').trim()
    if (!id) {
        // draftId 不传：查草稿表全部（或最新）
        return unwrap(http.get('/admissions/offers/drafts', { params: { draftId: '' } }))
    }
    return unwrap(http.get(`/admissions/offers/drafts/${id}`))
}
// 3.1) 拟录取草稿（全表查询，不传 draftId）
// GET /admissions/offers/drafts/items
export function listOfferDraftItems() {
    return unwrap(http.get('/admissions/offers/drafts/items'))
}

// 6.2) 批量加入拟录取草稿
export function addCandidatesToOfferDraftBatch(candidateIds, draftId) {
    return unwrap(http.post('/admissions/offers/drafts/items/batch', {
        candidateIds: candidateIds || [],
        draftId: draftId || ''
    }))
}
