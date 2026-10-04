import { callCloudFunction, uploadCloudFile } from './cloud'
import type { Question } from '../data/questions'
import type { PracticeRecord } from '../store/checkin'

export interface CloudUser {
  _id: string
  _openid: string
  nickName: string
  avatarUrl: string
  totalPracticed: number
  totalCorrect: number
  streakDays: number
  lastCheckinDate: string
}

export interface UserStats {
  totalPracticed: number
  totalCorrect: number
  accuracy: number
  streakDays: number
  isCheckedInToday: boolean
  lastCheckinDate: string
  recentRecords: PracticeRecord[]
}

export interface GetQuestionsResult {
  list: Question[]
  total: number
  page?: number
  pageSize?: number
  hasMore?: boolean
  random?: boolean
}

/**
 * 阶段 2：业务云服务层 (连接 UI 与 CloudBase 云函数)
 */

/** 用户安全登录 */
export async function apiLogin(userInfo?: { nickName?: string; avatarUrl?: string }) {
  const res = await callCloudFunction<{
    code: number
    message: string
    data: { openid: string; appid: string; user: CloudUser }
  }>('login', userInfo || {})
  return res.data
}

/** 分页或随机拉取题库 */
export async function apiGetQuestions(params: {
  tag?: string
  page?: number
  pageSize?: number
  random?: boolean
  count?: number
}) {
  const res = await callCloudFunction<{
    code: number
    message: string
    data: GetQuestionsResult
  }>('getQuestions', params)
  return res.data
}

/** 同步练习记录与连续打卡状态 */
export async function apiSyncPractice(record: {
  total: number
  correct: number
  durationSec: number
  tag: string
  wrongDetails?: any[]
}) {
  const res = await callCloudFunction<{
    code: number
    message: string
    data: { recordId: string; streakDays: number; todayStr: string }
  }>('syncPractice', record)
  return res.data
}

/** 获取个人打卡看板与统计大屏 */
export async function apiGetUserStats() {
  const res = await callCloudFunction<{
    code: number
    message: string
    data: UserStats
  }>('getUserStats', {})
  return res.data
}

/** 上传头像或图片至云存储 */
export async function apiUploadAvatar(filePath: string) {
  const cloudPath = `avatars/user_${Date.now()}.png`
  return await uploadCloudFile(cloudPath, filePath)
}
