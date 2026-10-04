// 微信云开发服务端云函数：练习记录持久化与连续打卡计算
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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

exports.main = async (event, context) => {
  const {
    total = 0,
    correct = 0,
    durationSec = 0,
    tag = '全部',
    wrongDetails = []
  } = event

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
    const yesterdayStr = getYesterdayDate()
    const now = Date.now()

    // 1. 存入 practice_records 集合
    const recordDoc = {
      _openid: openid,
      date: todayStr,
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      durationSec,
      tag,
      wrongDetails,
      createTime: now
    }

    const recRes = await db.collection('practice_records').add({
      data: recordDoc
    })

    // 2. 查出用户当前数据以计算打卡天数
    const userCol = db.collection('users')
    const userRes = await userCol.where({ _openid: openid }).get()

    let streakDays = 1
    if (userRes.data && userRes.data.length > 0) {
      const u = userRes.data[0]
      const lastDate = u.lastCheckinDate || ''

      if (lastDate === todayStr) {
        // 今天已打过卡，连续天数保持不变
        streakDays = u.streakDays || 1
      } else if (lastDate === yesterdayStr) {
        // 昨天打过卡，连续天数加 1
        streakDays = (u.streakDays || 0) + 1
      } else {
        // 断签，重置为 1
        streakDays = 1
      }

      // 原子累加做题数与正确数，并更新天数
      await userCol.doc(u._id).update({
        data: {
          totalPracticed: _.inc(total),
          totalCorrect: _.inc(correct),
          streakDays,
          lastCheckinDate: todayStr,
          updateTime: now
        }
      })
    } else {
      // 若无用户记录则自愈建档
      await userCol.add({
        data: {
          _openid: openid,
          nickName: '微信学员',
          totalPracticed: total,
          totalCorrect: correct,
          streakDays: 1,
          lastCheckinDate: todayStr,
          createTime: now,
          updateTime: now
        }
      })
    }

    return {
      code: 0,
      message: '打卡记录同步成功',
      data: {
        recordId: recRes._id,
        streakDays,
        todayStr
      }
    }
  } catch (err) {
    console.error('云函数 syncPractice 执行失败:', err)
    return {
      code: 500,
      message: '同步打卡记录失败',
      error: String(err)
    }
  }
}
