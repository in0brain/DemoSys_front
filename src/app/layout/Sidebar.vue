<template>
  <div class="wrap">
    <div class="title">菜单</div>

    <el-menu
        class="menu"
        :default-active="activePath"
        :default-openeds="openeds"
        :unique-opened="true"
        router
        @open="onOpen"
        @close="onClose"
    >
      <template v-for="group in menuGroups" :key="group.key">
        <el-sub-menu v-if="group.items.length > 0" :index="group.key">
          <template #title>{{ group.title }}</template>

          <el-menu-item
              v-for="item in group.items"
              :key="item.path"
              :index="item.path"
          >
            {{ item.title }}
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthState, refreshAuthState, hasAnyRole } from '@/domain/auth/service/auth.state'

const route = useRoute()
const router = useRouter()
const activePath = computed(() => route.path)

// 展开状态持久化
const STORAGE_KEY = 'SIDEBAR_OPENEDS'
const openeds = ref([])

// 响应式 auth
const auth = useAuthState()

onMounted(async () => {
  const saved = safeParse(localStorage.getItem(STORAGE_KEY))
  openeds.value = Array.isArray(saved) ? saved : []

  // 登录后 / 刷新页面时同步 roles（JWT -> roles，然后可选 /me）
  await refreshAuthState({ fetchMe: true })
})

function onOpen(index) {
  openeds.value = [index]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(openeds.value))
}

function onClose(index) {
  openeds.value = openeds.value.filter((x) => x !== index)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(openeds.value))
}

function safeParse(text) {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function normalizePath(p) {
  if (!p) return '/'
  return p.startsWith('/') ? p : '/' + p
}

/**
 * ✅ Vue Router 4：从 router.getRoutes() 取“已注册的路由”
 * 你需要的是 layout “/” 的 children
 */
function getLayoutChildrenRoutes() {
  const all = router.getRoutes() || []
  // 找到 path="/" 的那条（BaseLayout 那条）
  const layout = all.find(r => r.path === '/' && Array.isArray(r.children) && r.children.length > 0)
  return layout?.children || []
}

function canSeeRoute(r) {
  if (!r?.meta?.title) return false
  if (r.meta?.hidden) return false

  const allowed = r.meta?.roles
  if (!allowed || allowed.length === 0) return true

  // roles 还没出来：先显示 base 组，避免全白
  if (!auth.roles || auth.roles.length === 0) {
    return (r.meta?.group || 'base') === 'base'
  }

  return hasAnyRole(allowed)
}

const menuGroups = computed(() => {
  // 让 computed 依赖 roles，roles 变化会自动重算菜单
  const _ = auth.roles

  const children = getLayoutChildrenRoutes()

  const groups = [
    { key: 'base', title: '基础', items: [] },
    { key: 'admissions', title: '招生', items: [] },
    { key: 'education', title: '培养', items: [] },
    { key: 'defense', title: '答辩', items: [] },
  ]

  for (const r of children) {
    if (!canSeeRoute(r)) continue

    const g = r.meta?.group || 'base'
    const target = groups.find(x => x.key === g) || groups[0]

    target.items.push({
      path: normalizePath(r.path),
      title: r.meta.title,
      order: r.meta?.order ?? 999,
    })
  }

  for (const g of groups) {
    g.items.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order
      return a.title.localeCompare(b.title, 'zh-Hans-CN')
    })
  }

  return groups
})
</script>


<style scoped>
.wrap { height: 100%; display:flex; flex-direction:column; }
.title{
  height: 44px;
  display:flex;
  align-items:center;
  padding: 0 12px;
  font-size: 12px;
  color:#666;
  border-bottom: 1px solid #eee;
}
.menu { border-right: 0; }
</style>
