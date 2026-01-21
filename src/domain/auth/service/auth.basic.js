// src/domain/auth/service/auth.basic.js
import { httpUnwrap } from '@/common/http'

/**
 * 获取当前登录用户的个人信息
 * GET /me/
 *
 * 返回：聚合后的个人中心数据
 * {
 *   user,
 *   org,
 *   roles,
 *   permissions,
 *   profile,
 *   student?
 * }
 */
export function fetchMe(params = {}) {
    return httpUnwrap.get('/me/display/profile', { params })
}

/**
 * 获取当前用户的权限列表
 * GET /me/permissions
 */
export function fetchMyPermissions({ page, pageSize, filters = {} } = {}) {
    const params = {
        ...(page != null ? { page } : {}),
        ...(pageSize != null ? { pageSize } : {}),
        ...filters
    }
    return httpUnwrap.get('/me/permissions', { params })
}

/**
 * 调试接口：查看后端 SecurityContext 中的认证信息
 * GET /me/debug/auth
 *
 * 注意：该接口不是标准 ApiResponse，
 * httpUnwrap 会直接透传返回值
 */
export function fetchDebugAuth() {
    return httpUnwrap.get('/me/debug/auth')
}
