// 微信云开发服务端云函数：用户登录与档案初始化
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  // 安全红线：信任根在服务端，通过 getWXContext 提取，绝对不要从 event 中取客户端传上来的 openid
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      code: 401,
      message: '未能获取有效 openid'
    }
  }

  try {
    const userCol = db.collection('users')
    const userRes = await userCol.where({ _openid: openid }).get()

    let userData = null
    const now = Date.now()

    if (!userRes.data || userRes.data.length === 0) {
      // 首次登录：自动创建用户档案文档
      const doc = {
        _openid: openid,
        nickName: event.nickName || '微信学员',
        avatarUrl: event.avatarUrl || '',
        totalPracticed: 0,
        totalCorrect: 0,
        streakDays: 0,
        lastCheckinDate: '',
        createTime: now,
        updateTime: now
      }
      const addRes = await userCol.add({ data: doc })
      userData = { _id: addRes._id, ...doc }
    } else {
      userData = userRes.data[0]
      // 更新最后活跃时间
      await userCol.doc(userData._id).update({
        data: {
          updateTime: now,
          nickName: event.nickName || userData.nickName,
          avatarUrl: event.avatarUrl || userData.avatarUrl
        }
      })
    }

    return {
      code: 0,
      message: '登录成功',
      data: {
        openid,
        appid: wxContext.APPID,
        user: userData
      }
    }
  } catch (err) {
    console.error('云函数 login 执行失败:', err)
    return {
      code: 500,
      message: '登录处理失败',
      error: String(err)
    }
  }
}
