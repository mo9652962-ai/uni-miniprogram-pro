import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/** 单次练习记录 */
export interface PracticeRecord {
  id: string
  date: string        // YYYY-MM-DD
  timestamp: number
  tag: string
  total: number
  correct: number
  durationSec: number
}

const STORAGE_KEY = 'practice_records'

/** 获取本地日期字符串 YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const useCheckinStore = defineStore('checkin', () => {
  /** 从本地缓存读取历史记录（阶段 1 核心：uni.setStorageSync 持久化） */
  const records = ref<PracticeRecord[]>(
    (() => {
      try {
        const raw = uni.getStorageSync(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as PracticeRecord[]) : []
      } catch {
        return []
      }
    })()
  )

  /** 持久化到本地 */
  const persist = () => {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(records.value))
  }

  /** 今日是否已打卡 */
  const checkedInToday = computed(() =>
    records.value.some((r) => r.date === todayStr())
  )

  /** 今日练习次数 */
  const todayCount = computed(() =>
    records.value.filter((r) => r.date === todayStr()).length
  )

  /** 连续打卡天数 */
  const streakDays = computed(() => {
    if (records.value.length === 0) return 0
    const dateSet = new Set(records.value.map((r) => r.date))
    let streak = 0
    const cursor = new Date()
    // 若今天没打卡，从昨天开始算，避免直接断签显示 0
    if (!dateSet.has(todayStr())) {
      cursor.setDate(cursor.getDate() - 1)
    }
    while (true) {
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      const key = `${cursor.getFullYear()}-${m}-${d}`
      if (dateSet.has(key)) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  })

  /** 累计答题数 */
  const totalAnswered = computed(() =>
    records.value.reduce((sum, r) => sum + r.total, 0)
  )

  /** 累计正确率 */
  const accuracy = computed(() => {
    const total = records.value.reduce((sum, r) => sum + r.total, 0)
    if (total === 0) return 0
    const correct = records.value.reduce((sum, r) => sum + r.correct, 0)
    return Math.round((correct / total) * 100)
  })

  /** 最近 N 条记录（倒序） */
  const recentRecords = computed(() =>
    [...records.value].sort((a, b) => b.timestamp - a.timestamp)
  )

  /** 新增一条记录 */
  const addRecord = (record: Omit<PracticeRecord, 'id' | 'date' | 'timestamp'>) => {
    const newRecord: PracticeRecord = {
      ...record,
      id: `r_${Date.now()}`,
      date: todayStr(),
      timestamp: Date.now()
    }
    records.value.push(newRecord)
    persist()
    return newRecord
  }

  /** 清空全部记录 */
  const clearAll = () => {
    records.value = []
    uni.removeStorageSync(STORAGE_KEY)
  }

  return {
    records,
    checkedInToday,
    todayCount,
    streakDays,
    totalAnswered,
    accuracy,
    recentRecords,
    addRecord,
    clearAll
  }
})
