// src/domain/auth/service/auth.state.js
import { reactive, readonly } from 'vue'
import http from '@/common/http'
import { isAuthenticated, clearToken } from './auth.service'
import { getJwtPayload, getRolesFromToken } from './auth.role'

/**
 * 统一：前端只认 roles: string[]
 * - jwt 里有 roles => 直接用（最快、不会闪）
 * - /me 返回可能没有 roles / 结构不同 => 做兜底解析
 */

function unwrapApiResponse(resp) {
    if (!resp) return null
    const body = resp.data ?? resp
    if (body && typeof body === 'object' && 'data' in body) return body.data
    return body
}

function normalizeRoles(me) {
    if (!me || typeof me !== 'object') return []

    // 1) me.roles: ['ADMIN', ...]
    if (Array.isArray(me.roles) && me.roles.length > 0) {
        return me.roles.map(x => String(x).replace(/^ROLE_/, ''))
    }

    // 2) me.role: 'ADMIN'
    if (typeof me.role === 'string' && me.role.trim()) {
        return [me.role.trim().replace(/^ROLE_/, '')]
    }

    // 3) authorities: [{authority:'ROLE_ADMIN'}] 或 ['ROLE_ADMIN']
    const auths = me.authorities || me.authority || me.grantedAuthorities
    if (Array.isArray(auths) && auths.length > 0) {
        const out = []
        for (const a of auths) {
            const s = typeof a === 'string' ? a : a?.authority
            if (typeof s === 'string' && s.trim()) out.push(s.replace(/^ROLE_/, ''))
        }
        return out
    }

    return []
}

function unique(arr) {
    return Array.from(new Set((arr || []).filter(Boolean)))
}

// ---- 响应式状态（一次到位，Sidebar 直接读它）
const state = reactive({
    loading: false,
    loaded: false,

    // principal（后端 /me 返回的用户信息）
    me: null,

    // 统一的角色数组（你 routes.js meta.roles 也是数组）
    roles: [],

    // 常用字段（便于组件直接用）
    username: null,
    displayName: null,
})

let _loadingPromise = null

export function useAuthState() {
    // 只读导出，避免组件乱改
    return readonly(state)
}

/**
 * 登录成功后：调用这个刷新（重要！）
 * - 立刻从 token 同步 roles/username/displayName
 * - 再异步拉 /me 进行补全（可选）
 */
export async function refreshAuthState({ fetchMe = true } = {}) {
    // 未登录 => 清空
    if (!isAuthenticated()) {
        state.loading = false
        state.loaded = true
        state.me = null
        state.roles = []
        state.username = null
        state.displayName = null
        return state
    }

    // 1) 先从 JWT 立即填充（不卡 UI）
    const payload = getJwtPayload()
    const tokenRoles = getRolesFromToken()

    state.roles = unique(tokenRoles)
    state.username = payload?.username || payload?.sub || null
    state.displayName = payload?.displayName || null

    // 2) 可选：再拉 /me（补充更多信息）
    if (!fetchMe) {
        state.loaded = true
        return state
    }

    // 防并发
    if (_loadingPromise) return _loadingPromise

    state.loading = true
    _loadingPromise = (async () => {
        try {
            const resp = await http.get('/me/')
            const me = unwrapApiResponse(resp)

            if (!me) {
                clearToken()
                clearAuthState()
                return state
            }

            state.me = me

            // /me 可能包含更权威的信息：displayName、roles
            const meRoles = normalizeRoles(me)
            state.roles = unique(state.roles.concat(meRoles))

            state.username = state.username || me.username || me.userName || null
            state.displayName = state.displayName || me.displayName || me.name || null

            state.loaded = true
            return state
        } catch (e) {
            clearToken()
            clearAuthState()
            return state
        } finally {
            state.loading = false
            _loadingPromise = null
        }
    })()

    return _loadingPromise
}

/**
 * 兼容你原来的 ensureMeLoaded：仍然返回 me（但内部走响应式 state）
 */
export async function ensureMeLoaded() {
    await refreshAuthState({ fetchMe: true })
    return state.me
}

export function clearAuthState() {
    state.loading = false
    state.loaded = true
    state.me = null
    state.roles = []
    state.username = null
    state.displayName = null
    _loadingPromise = null
}

/**
 * 退出时建议调用
 */
export function logoutLocal() {
    clearToken()
    clearAuthState()
}

/**
 * 权限判断：是否拥有 allowedRoles 中任意一个
 */
export function hasAnyRole(allowedRoles) {
    if (!allowedRoles || allowedRoles.length === 0) return true
    const current = state.roles || []
    if (current.length === 0) return false
    return current.some(r => allowedRoles.includes(r))
}
