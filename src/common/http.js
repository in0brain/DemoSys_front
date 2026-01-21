// src/common/http.js
import axios from 'axios'
import { getToken, clearToken } from '@/domain/auth/service/auth.service'

/**
 * 1️⃣ 原始 http：保持旧行为（不要破坏已有代码）
 */
const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || '/api',
    timeout: 15000,
})

http.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

http.interceptors.response.use(
    (res) => res.data, // ⚠️ 保持你原来的语义
    (err) => {
        const status = err?.response?.status
        if (status === 401) {
            clearToken()
        }
        return Promise.reject(err)
    }
)

/**
 * 2️⃣ 解包工具（不影响 http 本体）
 */
function unwrapResp(resp) {
    if (resp && typeof resp.code === 'number') {
        if (resp.code === 0) return resp.data
        throw new Error(resp.message || '请求失败')
    }
    return resp
}

function unwrapError(err) {
    const msg =
        err?.response?.data?.message ||
        err?.message ||
        '请求失败'
    return new Error(msg)
}

/**
 * 3️⃣ 新的解包版客户端（给新 api 用）
 */
const httpUnwrap = {
    get(url, config) {
        return http.get(url, config).then(unwrapResp).catch((e) => {
            throw unwrapError(e)
        })
    },
    post(url, data, config) {
        return http.post(url, data, config).then(unwrapResp).catch((e) => {
            throw unwrapError(e)
        })
    },
    put(url, data, config) {
        return http.put(url, data, config).then(unwrapResp).catch((e) => {
            throw unwrapError(e)
        })
    },
    delete(url, config) {
        return http.delete(url, config).then(unwrapResp).catch((e) => {
            throw unwrapError(e)
        })
    },
}

export default http
export { httpUnwrap }
