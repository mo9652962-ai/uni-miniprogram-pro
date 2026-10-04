// 微信云开发服务端云函数：分页、筛选与随机拉取题库
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const {
    tag = '全部',
    page = 1,
    pageSize = 10,
    random = false,
    count = 5
  } = event

  try {
    const questionCol = db.collection('questions')
    
    // 构建筛选条件
    const query = {}
    if (tag && tag !== '全部') {
      query.tag = tag
    }

    // 1. 获取符合条件的总数
    const countRes = await questionCol.where(query).count()
    const total = countRes.total

    // 2. 模式 A: 练习模式 - 随机抽题
    if (random) {
      const takeCount = Math.min(count, total || count)
      // 云数据库聚合管道 sample 随机抽样
      const sampleRes = await questionCol.aggregate()
        .match(query)
        .sample({
          size: takeCount
        })
        .end()

      return {
        code: 0,
        message: '抽题成功',
        data: {
          list: sampleRes.list || [],
          total,
          random: true
        }
      }
    }

    // 3. 模式 B: 题库浏览 - 分页拉取
    const skip = Math.max(0, (page - 1) * pageSize)
    const listRes = await questionCol
      .where(query)
      .skip(skip)
      .limit(pageSize)
      .orderBy('order', 'asc')
      .get()

    const hasMore = skip + listRes.data.length < total

    return {
      code: 0,
      message: '拉取成功',
      data: {
        list: listRes.data || [],
        total,
        page,
        pageSize,
        hasMore
      }
    }
  } catch (err) {
    console.error('云函数 getQuestions 执行失败:', err)
    return {
      code: 500,
      message: '拉取题库失败',
      error: String(err)
    }
  }
}
