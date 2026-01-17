// src/domain/auth/service/auth.role.js
import { getToken } from './auth.service'

// 解析 JWT payload（base64url）
function parseJwt(token) {
    try {
        const part = token.split('.')[1]
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
        return JSON.parse(json)
    } catch {
        return null
    }
}

export function getJwtPayload() {
    const token = getToken()
    if (!token) return null
    return parseJwt(token)
}

/**
 * 从 JWT payload 读取 roles 数组
 * 后端现在 claims.put("roles", List<String>)
 */
export function getRolesFromToken() {
    const payload = getJwtPayload()
    const roles = payload?.roles
    return Array.isArray(roles) ? roles : []
}
