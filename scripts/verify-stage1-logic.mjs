/**
 * 阶段 1 逻辑验证：打卡统计 / 正确率 / 连续天数算法
 * 用真实执行验证 store 里的纯逻辑（不依赖 pinia / uni 运行时）
 */

function todayStr(d) {
  d = d || new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function streakDays(records, now) {
  now = now || new Date()
  if (records.length === 0) return 0
  const dateSet = new Set(records.map((r) => r.date))
  let streak = 0
  const cursor = new Date(now)
  if (!dateSet.has(todayStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (true) {
    const key = todayStr(cursor)
    if (dateSet.has(key)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else break
  }
  return streak
}

function accuracy(records) {
  const total = records.reduce((s, r) => s + r.total, 0)
  if (total === 0) return 0
  const correct = records.reduce((s, r) => s + r.correct, 0)
  return Math.round((correct / total) * 100)
}

let pass = 0
let fail = 0
function assert(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    pass++
    console.log(`  OK  ${name}`)
  } else {
    fail++
    console.log(`  FAIL ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

console.log('[Case 1] 连续打卡天数（基准日 2026-10-04）')
const base = new Date(2026, 9, 4)
assert('无记录 -> 0 天', streakDays([], base), 0)
assert('今天+昨天+前天 -> 3 天', streakDays([{ date: '2026-10-04' }, { date: '2026-10-03' }, { date: '2026-10-02' }], base), 3)
assert('今天没打但昨天打了 -> 保留 1 天', streakDays([{ date: '2026-10-03' }], base), 1)
assert('中间断一天 -> 只算连续段', streakDays([{ date: '2026-10-04' }, { date: '2026-10-03' }, { date: '2026-10-01' }], base), 2)

console.log('[Case 2] 正确率')
assert('无记录 -> 0%', accuracy([]), 0)
assert('10/10 -> 100%', accuracy([{ total: 10, correct: 10 }]), 100)
assert('合并 (8/10 + 5/10) -> 65%', accuracy([{ total: 10, correct: 8 }, { total: 10, correct: 5 }]), 65)
assert('四舍五入 (1/3) -> 33%', accuracy([{ total: 3, correct: 1 }]), 33)

console.log('[Case 3] 日期补零')
assert('todayStr 基准日', todayStr(base), '2026-10-04')
assert('todayStr 单位数补零', todayStr(new Date(2026, 0, 5)), '2026-01-05')

console.log('')
console.log(`结果：${pass} 通过 / ${fail} 失败`)
process.exit(fail > 0 ? 1 : 0)
