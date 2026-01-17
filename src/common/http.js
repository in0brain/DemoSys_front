// src/common/http.js
import axios from 'axios'
import { getToken, clearToken } from '@/domain/auth/service/auth.service'

const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || '/api',
    timeout: 15000,
})

http.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
        // 约定：Bearer Token（如你后端不是 Bearer，就改这里）
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

http.interceptors.response.use(
    (res) => res.data, // 让业务层直接拿 data（如果你后端统一 ApiResponse，这里再处理）
    (err) => {
        const status = err?.response?.status
        if (status === 401) {
            clearToken()
            // 可选：这里不直接 router 跳转，交给路由守卫/页面处理更干净
        }
        return Promise.reject(err)
    }
)

export default http
