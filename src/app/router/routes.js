import BaseLayout from '../layout/BaseLayout.vue'

// Auth
import Login from '../../domain/auth/pages/Login.vue'
import Profile from '../../domain/auth/pages/Profile.vue'
import SsoCallback from '../../domain/auth/pages/SsoCallback.vue'

// Admissions
import CandidateList from '../../domain/admissions/pages/CandidateList.vue'
import InterviewScoreEntry from '../../domain/admissions/pages/InterviewScoreEntry.vue'
import OfferDraft from '../../domain/admissions/pages/OfferDraft.vue'
import OfferPublish from '../../domain/admissions/pages/OfferPublish.vue'
import PublicOfferQuery from '../../domain/admissions/pages/PublicOfferQuery.vue'

// Education
import StudyPlanEdit from '../../domain/education/pages/StudyPlanEdit.vue'
import StudyPlanApprove from '../../domain/education/pages/StudyPlanApprove.vue'
import CourseSelect from '../../domain/education/pages/CourseSelect.vue'
import EnrollmentApprove from '../../domain/education/pages/EnrollmentApprove.vue'
import CreditProgress from '../../domain/education/pages/CreditProgress.vue'
import Timetable from '../../domain/education/pages/Timetable.vue'
import ProgramView from '../../domain/education/pages/ProgramView.vue'

// Defense
import ThesisSubmit from '../../domain/defense/pages/ThesisSubmit.vue'
import PlagiarismReport from '../../domain/defense/pages/PlagiarismReport.vue'
import BlindReviewAssign from '../../domain/defense/pages/BlindReviewAssign.vue'
import ExpertReviewPortal from '../../domain/defense/pages/ExpertReviewPortal.vue'
import DefenseSchedule from '../../domain/defense/pages/DefenseSchedule.vue'
import DefenseScoring from '../../domain/defense/pages/DefenseScoring.vue'

// Notification
import Inbox from '../../domain/notification/pages/Inbox.vue'
import NotificationDetail from '../../domain/notification/pages/Detail.vue'

// Files / Jobs
import FileCenter from '../../domain/files/pages/FileCenter.vue'
import JobCenter from '../../domain/jobs/pages/JobCenter.vue'

const Dashboard = { template: `<div class="page"><h2>Dashboard</h2><p>占位页</p></div>` }
const NotFound = { template: `<div class="page"><h2>404</h2><p>页面不存在</p></div>` }
const Forbidden = { template: `<div class="page"><h2>403</h2><p>无权限访问</p></div>` }

// 角色常量
const R = {
    ALL: ['ADMIN', 'TEACHER', 'STUDENT', 'EXPERT'],
    ADMIN: ['ADMIN'],
    TEACHER: ['TEACHER'],
    STUDENT: ['STUDENT'],
    EXPERT: ['EXPERT'],
    TEACHER_ADMIN: ['TEACHER', 'ADMIN'],
    STUDENT_TEACHER_ADMIN: ['STUDENT', 'TEACHER', 'ADMIN'],
}

// 用于 Sidebar 分组显示（不影响权限，只是菜单归类）
const GROUP = {
    BASE: 'base',
    ADM: 'admissions',
    EDU: 'education',
    DEF: 'defense',
}

export const routes = [
    { path: '/', redirect: '/dashboard' },

    // Public routes
    { path: '/login', component: Login, meta: { public: true } },
    { path: '/sso/callback', component: SsoCallback, meta: { public: true } },

    // Protected routes under layout
    {
        path: '/',
        component: BaseLayout,
        children: [
            // --- 基础
            { path: 'dashboard', component: Dashboard, meta: { title: '仪表盘', group: GROUP.BASE, roles: R.ALL } },
            { path: 'profile', component: Profile, meta: { title: '个人中心', group: GROUP.BASE, roles: R.ALL } },

            // 通知/文件/任务（你可以后续再细分，先这样）
            { path: 'notification/inbox', component: Inbox, meta: { title: '通知中心', group: GROUP.BASE, roles: R.ALL } },
            { path: 'notification/:id', component: NotificationDetail, meta: { group: GROUP.BASE, roles: R.ALL, hidden: true } },

            { path: 'files', component: FileCenter, meta: { title: '文件中心', group: GROUP.BASE, roles: R.TEACHER_ADMIN } },
            { path: 'jobs', component: JobCenter, meta: { title: '任务中心', group: GROUP.BASE, roles: R.ADMIN } },

            // --- 招生（管理员）
            { path: 'admissions/candidates', component: CandidateList, meta: { title: '考生列表', group: GROUP.ADM, roles: R.ADMIN } },
            {
                path: 'admissions/interview-scores/:candidateId',
                component: InterviewScoreEntry,
                meta: { title: '复试成绩录入', group: GROUP.ADM, roles: R.ADMIN }
            },

            { path: 'admissions/offer-draft', component: OfferDraft, meta: { title: '拟录取草稿', group: GROUP.ADM, roles: R.ADMIN } },
            { path: 'admissions/offer-publish', component: OfferPublish, meta: { title: '拟录取发布', group: GROUP.ADM, roles: R.ADMIN } },
            // 这里目前在 layout 下 -> 需要登录；要真正“公众查询”可以后续挪出去并 meta.public=true
            { path: 'admissions/public-query', component: PublicOfferQuery, meta: { title: '公示查询', group: GROUP.ADM, roles: R.ALL } },

            // --- 培养
            { path: 'education/study-plan/edit', component: StudyPlanEdit, meta: { title: '培养计划填写', group: GROUP.EDU, roles: R.STUDENT } },
            { path: 'education/study-plan/approve', component: StudyPlanApprove, meta: { title: '培养计划审批', group: GROUP.EDU, roles: R.TEACHER_ADMIN } },
            { path: 'education/course-select', component: CourseSelect, meta: { title: '选课', group: GROUP.EDU, roles: R.STUDENT } },
            { path: 'education/enrollment-approve', component: EnrollmentApprove, meta: { title: '选课审批', group: GROUP.EDU, roles: R.TEACHER_ADMIN } },
            { path: 'education/credit-progress', component: CreditProgress, meta: { title: '学分进度', group: GROUP.EDU, roles: R.STUDENT_TEACHER_ADMIN } },
            { path: 'education/timetable', component: Timetable, meta: { title: '课表', group: GROUP.EDU, roles: R.STUDENT } },
            { path: 'education/program', component: ProgramView, meta: { title: '培养方案', group: GROUP.EDU, roles: R.STUDENT_TEACHER_ADMIN } },

            // --- 答辩
            { path: 'defense/thesis-submit', component: ThesisSubmit, meta: { title: '论文提交', group: GROUP.DEF, roles: R.STUDENT } },
            { path: 'defense/plagiarism', component: PlagiarismReport, meta: { title: '查重报告', group: GROUP.DEF, roles: R.STUDENT_TEACHER_ADMIN } },
            { path: 'defense/blind-assign', component: BlindReviewAssign, meta: { title: '盲审分配', group: GROUP.DEF, roles: R.ADMIN } },

            // ✅ 专家端：只给 EXPERT
            { path: 'defense/expert-portal', component: ExpertReviewPortal, meta: { title: '专家评阅入口', group: GROUP.DEF, roles: R.EXPERT } },

            { path: 'defense/schedule', component: DefenseSchedule, meta: { title: '答辩安排', group: GROUP.DEF, roles: R.ADMIN } },
            { path: 'defense/scoring', component: DefenseScoring, meta: { title: '答辩评分', group: GROUP.DEF, roles: R.ADMIN } },

            // 403（给守卫用）
            { path: '403', component: Forbidden, meta: { title: '无权限', group: GROUP.BASE, roles: R.ALL, hidden: true } },
        ],
    },

    { path: '/:pathMatch(.*)*', component: NotFound, meta: { public: true } },
]
