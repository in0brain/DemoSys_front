<template>
  <div class="page">
    <div class="wrap">
      <div class="header">
        <h2>个人中心</h2>
        <div class="sub">这里先用静态数据预览布局，后续替换为 /me 接口返回。</div>
      </div>

      <!-- 顶部概览：融到主容器里 -->
      <el-card shadow="never" class="card overview">
        <div class="overview-row">
          <el-avatar :size="64" :src="me.profile.avatarUrl || undefined">
            {{ me.user.displayName?.slice(0, 1) || 'U' }}
          </el-avatar>

          <div class="overview-meta">
            <div class="topline">
              <div class="name">{{ me.user.displayName }}</div>
              <el-tag size="small" type="info">{{ roleLabel }}</el-tag>
              <el-tag v-if="me.profile.title" size="small" type="success">{{ me.profile.title }}</el-tag>
            </div>

            <div class="line">
              用户名：<b>{{ me.user.username }}</b>
              <span class="dot">·</span>
              状态：<b>{{ me.user.status }}</b>
              <span class="dot">·</span>
              组织：<b class="ellipsis" :title="me.org.orgName">{{ me.org.orgName }}</b>
            </div>

            <div class="badges">
              <div class="badge">
                <div class="b-label">角色</div>
                <div class="b-value ellipsis" :title="me.roles.join('、')">{{ me.roles.join('、') }}</div>
              </div>
              <div class="badge">
                <div class="b-label">权限数</div>
                <div class="b-value">{{ me.permissions.length }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 账号信息 -->
      <el-card shadow="never" class="card">
        <template #header>
          <div class="card-title">账号信息</div>
        </template>

        <el-descriptions :column="descColumn" border>
          <el-descriptions-item label="用户ID">{{ me.user.id }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">{{ me.user.userType }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ me.user.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="最近登录">{{ me.user.lastLoginAt || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 联系方式 -->
      <el-card shadow="never" class="card">
        <template #header>
          <div class="card-title">联系方式</div>
        </template>

        <el-descriptions :column="descColumn" border>
          <el-descriptions-item label="手机号">
            <span class="ellipsis" :title="me.profile.phone || '-'">{{ me.profile.phone || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            <span class="ellipsis" :title="me.profile.email || '-'">{{ me.profile.email || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="头衔/职称">
            <span class="ellipsis" :title="me.profile.title || '-'">{{ me.profile.title || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="资料更新时间">{{ me.profile.updatedAt }}</el-descriptions-item>
        </el-descriptions>

        <div class="actions">
          <el-button type="primary" disabled>编辑资料（待接入）</el-button>
          <el-button disabled>修改密码（待接入）</el-button>
        </div>
      </el-card>

      <!-- 学生才显示 -->
      <el-card v-if="me.user.userType === 'student' && me.student" shadow="never" class="card">
        <template #header>
          <div class="card-title">学籍信息</div>
        </template>

        <el-descriptions :column="descColumn" border>
          <el-descriptions-item label="学号">
            <span class="ellipsis" :title="me.student.studentNo">{{ me.student.studentNo }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="入学年份">{{ me.student.enrollmentYear }}</el-descriptions-item>
          <el-descriptions-item label="培养层次">{{ me.student.degreeLevel }}</el-descriptions-item>
          <el-descriptions-item label="学籍状态">{{ me.student.studentStatus }}</el-descriptions-item>
          <el-descriptions-item label="学院">
            <span class="ellipsis" :title="me.student.collegeName">{{ me.student.collegeName }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="系/部门">
            <span class="ellipsis" :title="me.student.deptName">{{ me.student.deptName }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="专业">
            <span class="ellipsis" :title="me.student.majorName">{{ me.student.majorName }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ me.student.updatedAt }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 调试区：token（弱化） -->
      <el-card shadow="never" class="card debug">
        <template #header>
          <div class="card-title">调试信息</div>
        </template>

        <div class="muted">当前 token：</div>
        <pre class="box">{{ token }}</pre>
        <div class="hint">后续将 token 改为从 /me 里展示 roles/permissions/profile（或仅用于调试）。</div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { getToken } from '../service/auth.service'
import { fetchMe } from '@/domain/auth/service/auth.basic'

const token = computed(() => getToken() || '(未登录)')

/** Descriptions 自适应列数：大屏 3，中屏 2，小屏 1 */
const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const onResize = () => (width.value = window.innerWidth)
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

const descColumn = computed(() => {
  if (width.value >= 1400) return 3
  if (width.value >= 900) return 2
  return 1
})

/**
 * 页面使用的“统一 me 结构”（适配层）
 * - 无论后端返回新结构（MeDisplayDTO）
 * - 还是你之前的 mock 结构（有 org 独立字段）
 * 最终都对齐到这里，模板就不会炸
 */
const me = reactive({
  user: {
    id: '-',
    username: '-',
    displayName: '-',
    userType: '-',
    status: '-',         // 后端若暂未返回，会显示 '-'
    createdAt: '-',      // 同上
    lastLoginAt: '-'     // 同上
  },
  org: {
    orgId: null,
    orgName: '-'         // 兼容旧模板里 me.org.orgName
  },
  roles: [],
  permissions: [],
  profile: {
    phone: '-',
    email: '-',
    title: '',
    avatarUrl: '',       // 后端若暂未返回，不影响
    updatedAt: '-'       // 后端若暂未返回，会显示 '-'
  },
  student: null          // student 或 null
})

function safeStr(v, fallback = '-') {
  if (v === null || v === undefined) return fallback
  const s = String(v)
  return s.trim() === '' ? fallback : s
}

function safeArr(v) {
  return Array.isArray(v) ? v : []
}

/**
 * 将后端 /me 返回的 data 适配成页面 me 结构
 * 兼容：
 * 1) 新后端：{ user, roles, permissions, profile, student }
 *    - user 内含 orgName/orgId
 * 2) 旧 mock：{ user, org, roles, permissions, profile, student }
 */
function applyMe(data) {
  if (!data || typeof data !== 'object') return

  console.log(data)
  const u = data.user || {}
  const o = data.org || {}

  // user
  me.user.id = safeStr(u.id ?? data.id)
  me.user.username = safeStr(u.username ?? data.username)
  me.user.displayName = safeStr(u.displayName ?? data.displayName)
  me.user.userType = safeStr(u.userType ?? data.userType)
  me.user.status = safeStr(u.status ?? data.status, '-') // 可能没有
  me.user.createdAt = safeStr(u.createdAt ?? data.createdAt, '-') // 可能没有
  me.user.lastLoginAt = safeStr(u.lastLoginAt ?? data.lastLoginAt, '-') // 可能没有

  // org：新结构在 user 里，旧结构在 org 里
  me.org.orgId = u.orgId ?? o.orgId ?? null
  me.org.orgName = safeStr(u.orgName ?? o.orgName, '-')

  // roles / permissions
  me.roles = safeArr(data.roles)
  me.permissions = safeArr(data.permissions)

  // profile：后端可能只返回 phone/email/title
  const p = data.profile || {}
  me.profile.phone = safeStr(p.phone, '-')
  me.profile.email = safeStr(p.email, '-')
  me.profile.title = safeStr(p.title, '') === '-' ? '' : safeStr(p.title, '')
  me.profile.avatarUrl = safeStr(p.avatarUrl, '')
  me.profile.updatedAt = safeStr(p.updatedAt, '-') // 后端没给也 ok

  // student：后端可能不返回 updatedAt
  const s = data.student
  if (s && typeof s === 'object') {
    me.student = {
      studentNo: safeStr(s.studentNo, '-'),
      collegeName: safeStr(s.collegeName, '-'),
      deptName: safeStr(s.deptName, '-'),
      majorName: safeStr(s.majorName, '-'),
      enrollmentYear: s.enrollmentYear ?? '-',
      degreeLevel: safeStr(s.degreeLevel, '-'),
      studentStatus: safeStr(s.studentStatus, '-'),
      updatedAt: safeStr(s.updatedAt, '-') // 后端没给也 ok
    }
  } else {
    me.student = null
  }
}

const loading = ref(false)
const loadError = ref('')

async function loadMe() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchMe()
    applyMe(data)
  } catch (e) {
    loadError.value = e?.message || '加载失败'
    // 保留页面默认 me，避免整个页面炸
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMe()
})

const roleLabel = computed(() => {
  const t = me.user.userType
  if (t === 'student') return '学生'
  if (t === 'teacher') return '导师'
  if (t === 'expert') return '专家'
  if (t === 'admin') return '管理员'
  return t || '-'
})
</script>

<style scoped>
.page { padding: 8px; }

/* 主容器：居中 + 限宽（你说的“右边窄点”就是这个） */
.wrap{
  max-width: 1080px;   /* 你觉得还宽就改成 960px */
  margin: 0 auto;
}

.header { margin-bottom: 12px; }
.sub { color:#666; font-size: 13px; margin-top: 4px; }

.card { border-radius: 12px; margin-bottom: 12px; }
.card-title { font-weight: 600; }

.overview-row{
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.overview-meta{ flex: 1; min-width: 0; }
.topline{
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.name{ font-size: 18px; font-weight: 700; }

.line{ color:#666; font-size: 13px; margin-top: 6px; }
.dot{ margin: 0 6px; color:#bbb; }

.badges{
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.badge{
  padding: 10px;
  background:#fafafa;
  border-radius: 10px;
}
.b-label{ color:#888; font-size: 12px; }
.b-value{ margin-top: 6px; font-weight: 600; }

/* 操作按钮：窄屏自动换行 */
.actions { margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap; }

/* token 盒子 */
.box{
  padding: 12px;
  background:#f7f7f7;
  border-radius: 10px;
  overflow:auto;
  margin-top: 8px;
}
.hint{ color:#666; margin-top: 8px; font-size: 13px; }
.muted{ color:#666; font-size: 13px; }

/* 通用：单行省略 */
.ellipsis{
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

/* Descriptions label 不换行，避免挤压 */
:deep(.el-descriptions__label){
  white-space: nowrap;
}

/* 小屏：概览区变纵向 */
@media (max-width: 720px){
  .wrap{ max-width: 100%; }
  .overview-row{ flex-direction: column; align-items: flex-start; }
  .badges{ grid-template-columns: 1fr; }
  .name{ font-size: 16px; }
}

/* 调试区弱化一点 */
.debug :deep(.el-card__header){
  opacity: .9;
}
</style>
