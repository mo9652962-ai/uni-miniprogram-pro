// 微信云开发服务端云函数：安全获取当前调用者的 openid 与 appid
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  // 安全红线：信任根在服务端，通过 getWXContext 提取，绝对不要从 event 中取客户端传上来的 openid
  const wxContext = cloud.getWXContext()

  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    env: wxContext.ENV,
    serverTime: new Date().toISOString()
  }
}
