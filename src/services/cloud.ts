import { ENV } from '../config/env'
import { QUESTION_BANK as QUESTIONS } from '../data/questions'

let isCloudInitialized = false

/**
 * 阶段 2 轻量全栈：微信云开发 CloudBase 封装层
 * 具备真实云函数调用、环境免密认证、以及在测试号/无配额环境下的全功能本地 Mock 降级引擎
 */
export function initCloud() {
  // #ifdef MP-WEIXIN
  if (isCloudInitialized) return
  if (typeof wx !== 'undefined' && wx.cloud) {
    try {
      if (ENV.cloudEnvId && ENV.cloudEnvId !== 'your-cloud-env-id') {
        wx.cloud.init({
          env: ENV.cloudEnvId,
          traceUser: true
        })
        isCloudInitialized = true
        console.log('✅ [CloudBase] 微信云开发环境初始化完成:', ENV.cloudEnvId)
      } else {
        console.log('ℹ️ [CloudBase] 未配置生产 cloudEnvId，将优先启用本地云仿真引擎')
      }
    } catch (e) {
      console.warn('⚠️ [CloudBase] 云开发初始化跳过或失败:', e)
    }
  } else {
    console.warn('⚠️ [CloudBase] 当前环境未检测到 wx.cloud API')
  }
  // #endif
}

function getFormatDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getYesterdayDate() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return getFormatDate(d)
}

/** 本地仿真云函数执行器（在微信测试号或无云配额时提供 100% 契约一致的数据与分页） */
function runLocalCloudMock<T = any>(name: string, data: Record<string, any>): T {
  console.log(`[CloudBase Simulation] 调度云函数仿真: ${name}`, data)

  if (name === 'login') {
    const cachedUser = uni.getStorageSync('mock_cloud_user')
    let user = cachedUser ? JSON.parse(cachedUser) : null
    if (!user) {
      user = {
        _id: 'u_' + Date.now(),
        _openid: 'o6zAJs3Rv70C4Finbr6coFPqrFq4',
        nickName: data.nickName || '微信测试学员',
        avatarUrl: data.avatarUrl || '',
        totalPracticed: 0,
        totalCorrect: 0,
        streakDays: 0,
        lastCheckinDate: '',
        createTime: Date.now()
      }
      uni.setStorageSync('mock_cloud_user', JSON.stringify(user))
    }
    return {
      code: 0,
      message: '登录成功(本地云仿真)',
      data: {
        openid: user._openid,
        appid: 'wxe264a9bbdca389e5',
        user
      }
    } as unknown as T
  }

  if (name === 'getQuestions') {
    const { tag = '全部', page = 1, pageSize = 5, random = false, count = 5 } = data
    let list = [...QUESTIONS]
    if (tag && tag !== '全部') {
      list = list.filter((q) => q.tag === tag)
    }
    const total = list.length

    if (random) {
      // 随机抽题
      const shuffled = [...list].sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, Math.min(count, total))
      return {
        code: 0,
        message: '抽题成功(本地云仿真)',
        data: {
          list: selected,
          total,
          random: true
        }
      } as unknown as T
    }

    // 分页拉取
    const skip = Math.max(0, (page - 1) * pageSize)
    const pagedList = list.slice(skip, skip + pageSize)
    const hasMore = skip + pagedList.length < total

    return {
      code: 0,
      message: '拉取题库成功(本地云仿真)',
      data: {
        list: pagedList,
        total,
        page,
        pageSize,
        hasMore
      }
    } as unknown as T
  }

  if (name === 'syncPractice') {
    const { total = 0, correct = 0, durationSec = 0, tag = '全部', wrongDetails = [] } = data
    const todayStr = getFormatDate()
    const yesterdayStr = getYesterdayDate()

    // 读写本地 practice_records
    let records: any[] = []
    try {
      const raw = uni.getStorageSync('practice_records')
      if (raw) records = JSON.parse(raw)
    } catch {}

    const newRec = {
      id: 'rec_' + Date.now(),
      date: todayStr,
      timestamp: Date.now(),
      total,
      correct,
      durationSec,
      tag,
      wrongDetails
    }
    records.unshift(newRec)
    uni.setStorageSync('practice_records', JSON.stringify(records))

    // 更新用户连续打卡天数
    let user: any = {}
    try {
      const uRaw = uni.getStorageSync('mock_cloud_user')
      if (uRaw) user = JSON.parse(uRaw)
    } catch {}

    let streak = user.streakDays || 0
    if (user.lastCheckinDate === todayStr) {
      // 今天打过，保持
      streak = Math.max(1, streak)
    } else if (user.lastCheckinDate === yesterdayStr) {
      streak += 1
    } else {
      streak = 1
    }

    user.streakDays = streak
    user.lastCheckinDate = todayStr
    user.totalPracticed = (user.totalPracticed || 0) + total
    user.totalCorrect = (user.totalCorrect || 0) + correct
    uni.setStorageSync('mock_cloud_user', JSON.stringify(user))

    return {
      code: 0,
      message: '打卡同步成功(本地云仿真)',
      data: {
        recordId: newRec.id,
        streakDays: streak,
        todayStr
      }
    } as unknown as T
  }

  if (name === 'getUserStats') {
    let records: any[] = []
    try {
      const raw = uni.getStorageSync('practice_records')
      if (raw) records = JSON.parse(raw)
    } catch {}

    let user: any = {}
    try {
      const uRaw = uni.getStorageSync('mock_cloud_user')
      if (uRaw) user = JSON.parse(uRaw)
    } catch {}

    const todayStr = getFormatDate()
    const totalPracticed = records.reduce((s, r) => s + (r.total || 0), 0)
    const totalCorrect = records.reduce((s, r) => s + (r.correct || 0), 0)
    const accuracy = totalPracticed > 0 ? Math.round((totalCorrect / totalPracticed) * 100) : 0
    const isCheckedInToday = records.some((r) => r.date === todayStr)

    return {
      code: 0,
      message: '获取成功(本地云仿真)',
      data: {
        totalPracticed,
        totalCorrect,
        accuracy,
        streakDays: user.streakDays || (records.length > 0 ? 1 : 0),
        isCheckedInToday,
        lastCheckinDate: user.lastCheckinDate || (isCheckedInToday ? todayStr : ''),
        recentRecords: records.slice(0, 10)
      }
    } as unknown as T
  }

  return {
    code: 0,
    message: '通用仿真调用响应',
    data: data
  } as unknown as T
}

/**
 * 调用云函数 (封装安全调用、错误拦截与无缝仿真降级)
 */
export function callCloudFunction<T = any>(name: string, data: Record<string, any> = {}): Promise<T> {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.cloud && isCloudInitialized) {
    return new Promise((resolve) => {
      wx.cloud.callFunction({
        name,
        data,
        success: (res: any) => {
          if (res.result && (res.result.code === 0 || res.result.code === 200)) {
            resolve(res.result as T)
          } else {
            console.warn(`[CloudFunction Result Abnormal: ${name}]`, res.result)
            resolve(runLocalCloudMock<T>(name, data))
          }
        },
        fail: (err: any) => {
          console.warn(`[CloudFunction Fail: ${name}] 将无缝降级至本地云仿真引擎:`, err?.errMsg || err)
          resolve(runLocalCloudMock<T>(name, data))
        }
      })
    })
  }
  // #endif

  // 非真机云环境或测试号降级处理
  return Promise.resolve(runLocalCloudMock<T>(name, data))
}

/**
 * 上传图片/文件至云存储 (自带 CDN 加速)
 */
export function uploadCloudFile(cloudPath: string, filePath: string): Promise<string> {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.cloud && isCloudInitialized) {
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: (res: any) => {
          resolve(res.fileID)
        },
        fail: (err: any) => {
          console.warn('[CloudStorage Upload Fail, Fallback to local]', err)
          resolve(filePath)
        }
      })
    })
  }
  // #endif
  return Promise.resolve(filePath)
}
