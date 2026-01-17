// src/domain/auth/service/auth.local.js
import http from '@/common/http'
import { setToken, clearToken } from './auth.service'
import { refreshAuthState } from './auth.state'

// 真实登录：对齐 swagger 的 path 和字段
export async function loginLocal({ username, password }) {
    if (!username || !password) {
        return { ok: false, message: '请输入账号和密码' }
    }

    try {
        // 1) 登录
        const resp = await http.post('/auth/local/login', { username, password })

        // 兼容多种返回结构：
        const token =
            resp?.token ||
            resp?.data?.token ||
            resp?.data?.accessToken ||
            resp?.accessToken ||
            resp?.data?.data?.token ||
            resp?.data?.data?.accessToken

        if (!token) {
            clearToken()
            return { ok: false, message: '登录接口未返回 token（请检查后端响应字段）' }
        }

        // ⚠️ 你的后端 LocalLoginResponse 里 token 是纯 token
        // 但你 JwtAuthFilter 期望请求头是 "Bearer xxx"
        // 所以前端存储时，建议统一存 "Bearer <token>"，避免后面每次拼接
        setToken(token)
        await refreshAuthState({ fetchMe: true })
        return { ok: true, token }

    } catch (e) {
        clearToken()
        // 尽量把后端 message 透出
        const msg =
            e?.response?.data?.message ||
            e?.response?.data?.msg ||
            e?.message ||
            '登录失败'
        return { ok: false, message: msg }
    }
}
