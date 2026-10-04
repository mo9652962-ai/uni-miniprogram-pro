// 微信云开发服务端云函数：用户打卡看板与历史记录汇总
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

function getFormatDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: 401,
      message: '未能获取有效 openid'
    }
  }

  try {
    const todayStr = getFormatDate()

    // 1. 获取用户信息
    const userRes = await db.collection('users').where({ _openid: openid }).get()
    const user = (userRes.data && userRes.data[0]) || {
      totalPracticed: 0,
      totalCorrect: 0,
      streakDays: 0,
      lastCheckinDate: ''
    }

    // 2. 获取最近 10 条打卡记录
    const recRes = await db.collection('practice_records')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()

    const total = user.totalPracticed || 0
    const correct = user.totalCorrect || 0
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const isCheckedInToday = user.lastCheckinDate === todayStr

    return {
      code: 0,
      message: '获取成功',
      data: {
        totalPracticed: total,
        totalCorrect: correct,
        accuracy,
        streakDays: user.streakDays || 0,
        isCheckedInToday,
        lastCheckinDate: user.lastCheckinDate || '',
        recentRecords: recRes.data || []
      }
    }
  } catch (err) {
    console.error('云函数 getUserStats 执行失败:', err)
    return {
      code: 500,
      message: '获取统计失败',
      error: String(err)
    }
  }
}
