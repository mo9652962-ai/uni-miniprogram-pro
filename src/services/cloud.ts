import { ENV } from '../config/env'

let isCloudInitialized = false

/**
 * 模块 3 轻量全栈：微信云开发 CloudBase 封装层
 * 免服务器、免配置域名、免 SSL 证书
 */
export function initCloud() {
  // #ifdef MP-WEIXIN
  if (isCloudInitialized) return
  if (typeof wx !== 'undefined' && wx.cloud) {
    try {
      wx.cloud.init({
        env: ENV.cloudEnvId,
        traceUser: true
      })
      isCloudInitialized = true
      console.log('✅ [CloudBase] 微信云开发环境初始化完成:', ENV.cloudEnvId)
    } catch (e) {
      console.warn('⚠️ [CloudBase] 云开发初始化跳过或失败 (可能未开通云开发服务):', e)
    }
  } else {
    console.warn('⚠️ [CloudBase] 当前环境未检测到 wx.cloud API')
  }
  // #endif
}

/**
 * 调用云函数 (封装安全调用与容错降级)
 */
export function callCloudFunction<T = any>(name: string, data: Record<string, any> = {}): Promise<T> {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.cloud) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name,
        data,
        success: (res: any) => {
          resolve(res.result as T)
        },
        fail: (err: any) => {
          console.warn(`[CloudFunction Fail: ${name}]`, err)
          // 本地 Mock 降级模拟，保障无云环境时依然可演示
          resolve({
            mock: true,
            functionName: name,
            openid: 'mock_wx_openid_demo_123456',
            success: true
          } as unknown as T)
        }
      })
    })
  }
  // #endif

  // 非微信环境返回 Mock 数据
  return Promise.resolve({
    mock: true,
    functionName: name,
    message: '非小程序环境自动降级 Mock'
  } as unknown as T)
}

/**
 * 上传图片/文件至云存储 (自带 CDN 加速)
 */
export function uploadCloudFile(cloudPath: string, filePath: string): Promise<string> {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.cloud) {
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: (res: any) => {
          resolve(res.fileID)
        },
        fail: (err: any) => {
          reject(err)
        }
      })
    })
  }
  // #endif
  return Promise.resolve('https://mock-cloud-storage.com/' + cloudPath)
}
