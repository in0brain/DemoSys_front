// src/domain/education/service/education.api.js
import http from '@/common/http'

/**
 * =========================
 * 3.2 课程与选课（SR-EDU-2）
 * =========================
 */

/**
 * 课程列表（选课页）
 * GET /education/courses
 */
export function fetchCourses(params = {}) {
    return http.get('/education/courses', {
        params,
    })
}

/**
 * 课程详情
 * GET /education/courses/{courseId}
 */
export function fetchCourseDetail(courseId) {
    return http.get(`/education/courses/${courseId}`)
}

/**
 * 我的选课申请列表
 * GET /education/enrollments
 */
export function fetchMyEnrollments(params = {}) {
    return http.get('/education/enrollments', {
        params,
    })
}

/**
 * 提交选课申请
 * POST /education/enrollments
 *
 * request 示例：
 * {
 *   courseCodes: ["CS101", "CS102"]
 * }
 */
export function submitEnrollment(data) {
    return http.post('/education/enrollments', data)
}

/**
 * 审批待办列表（导师 / 学院）
 * GET /education/enrollments/todos?node=ADVISOR|COLLEGE
 */
export function fetchEnrollmentTodos(node) {
    return http.get('/education/enrollments/todos', {
        params: { node },
    })
}

/**
 * 审批通过
 * POST /education/enrollments/{id}/approve
 */
export function approveEnrollment(enrollId) {
    return http.post(`/education/enrollments/${enrollId}/approve`)
}

/**
 * 审批驳回
 * POST /education/enrollments/{id}/reject
 *
 * data 可选（SR 阶段可以为空）
 */
export function rejectEnrollment(enrollId, data = {}) {
    return http.post(`/education/enrollments/${enrollId}/reject`, data)
}

/**
 * =========================
 * 3.3 学分统计（SR-EDU-3）
 * =========================
 */

/**
 * 我的学分进度
 * GET /education/credits/me
 */
export function getCreditsMe(params = {}) {
    return http.get('/education/credits/me', {
        params,
    })
}

// 学院：学分总览（全体学生）
export function getCreditsOverview(params = {}) {
    return http.get('/education/credits/overview', { params })
}

// 学院：指定学生学分明细
export function getCreditsByStudentId(studentId) {
    return http.get(`/education/credits/students/${studentId}`)
}