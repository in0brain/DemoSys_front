// src/router/guards.js
import { isAuthenticated } from '@/domain/auth/service/auth.service'
import { useAuthState, refreshAuthState, logoutLocal } from '@/domain/auth/service/auth.state'

// 角色默认首页（专家直接进专家入口）
const HOME_BY_ROLE = {
    ADMIN: '/dashboard',
    TEACHER: '/dashboard',
    STUDENT: '/dashboard',
    EXPERT: '/defense/expert-portal',
}

// 判断路由是否允许当前用户访问（allowedRoles 是 routes.js 里 meta.roles）
function canAccess(to, userRoles) {
    const allowedRoles = to.meta?.roles
    if (!allowedRoles || allowedRoles.length === 0) return true
    if (!userRoles || userRoles.length === 0) return false
    // 任一命中即可
    return userRoles.some(r => allowedRoles.includes(r))
}

// 取一个“主角色”用于首页跳转（优先 EXPERT）
function pickPrimaryRole(userRoles) {
    if (!Array.isArray(userRoles) || userRoles.length === 0) return null
    if (userRoles.includes('EXPERT')) return 'EXPERT'
    if (userRoles.includes('ADMIN')) return 'ADMIN'
    if (userRoles.includes('TEACHER')) return 'TEACHER'
    if (userRoles.includes('STUDENT')) return 'STUDENT'
    return userRoles[0]
}

export function setupGuards(router) {
    const auth = useAuthState()

    router.beforeEach(async (to) => {
        // 1) public 不拦截
        if (to.meta?.public) return true

        // 2) 未登录 → 去登录页
        if (!isAuthenticated()) {
            return { path: '/login', query: { redirect: to.fullPath } }
        }

        // 3) 已登录：确保 roles 已同步（先从 JWT 同步，再补 /me）
        //    - 这一步非常关键：否则刷新页面时 roles 可能还是空导致误判
        await refreshAuthState({ fetchMe: true })

        const userRoles = auth.roles || []
        const primaryRole = pickPrimaryRole(userRoles)

        // roles 仍为空：说明 token 失效或 /me 拉不到 -> 退出并回登录
        if (!primaryRole) {
            logoutLocal()
            return { path: '/login', query: { redirect: to.fullPath } }
        }

        // 4) 登录后访问 /login：按角色跳首页
        if (to.path === '/login') {
            return { path: HOME_BY_ROLE[primaryRole] || '/dashboard' }
        }

        // 5) 角色权限校验：不允许访问 → 去 403
        if (!canAccess(to, userRoles)) {
            if (to.path === '/403') return true
            return { path: '/403' }
        }

        // 6) ✅ 专家额外强约束：只允许专家进入指定页面（兜底防 meta.roles 配错）
        if (primaryRole === 'EXPERT') {
            const allow = new Set([
                '/dashboard',
                '/profile',
                '/notification/inbox',
                '/defense/expert-portal',
                '/403',
            ])

            if (!allow.has(to.path)) {
                return { path: HOME_BY_ROLE.EXPERT }
            }
        }

        return true
    })
}
