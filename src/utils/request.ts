import { ENV } from '../config/env'
import { useUserStore } from '../store/user'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface RequestOptions extends UniApp.RequestOptions {
  showLoading?: boolean
  loadingTitle?: string
}

/**
 * 模块 3 标准自建后端：封装基于 uni.request 的网络请求层
 * 具备请求拦截、响应拦截、Token 自动携带、全局异常统一弹窗、自动 Mock 降级
 */
export function request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  const userStore = useUserStore()
  
  // 1. 请求拦截配置
  const url = options.url.startsWith('http') 
    ? options.url 
    : `${ENV.baseUrl}${options.url.startsWith('/') ? '' : '/'}${options.url}`

  const header: Record<string, any> = {
    'Content-Type': 'application/json',
    'X-Client-Platform': 'mp-weixin',
    ...options.header
  }

  // 自动注入 Authorization Token
  if (userStore.token) {
    header['Authorization'] = `Bearer ${userStore.token}`
  }

  if (options.showLoading) {
    uni.showLoading({
      title: options.loadingTitle || '加载中...',
      mask: true
    })
  }

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url,
      header,
      timeout: options.timeout || ENV.timeout,
      success: (res) => {
        // 2. HTTP 状态码拦截
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data as ApiResponse<T>
          // 业务状态码规范（假设 200 或 0 代表成功）
          if (body.code === 200 || body.code === 0) {
            resolve(body)
          } else {
            // 业务级异常，全局 Toast 提示
            uni.showToast({
              title: body.message || '请求失败',
              icon: 'none'
            })
            reject(body)
          }
        } else if (res.statusCode === 401) {
          // 401: Token 失效或未登录
          userStore.logout()
          uni.showModal({
            title: '登录已过期',
            content: '请重新登录以继续操作',
            showCancel: false,
            success: () => {
              uni.switchTab({ url: '/pages/my/index' })
            }
          })
          reject(new Error('Unauthorized'))
        } else {
          uni.showToast({
            title: `服务器异常 [${res.statusCode}]`,
            icon: 'none'
          })
          reject(new Error(`HTTP Status ${res.statusCode}`))
        }
      },
      fail: (err) => {
        // 开发模式下网络失败自动触发 Mock 兜底，便于无后端时调试
        if (ENV.enableMock) {
          console.warn(`[API Mock Fallback] 请求失败触发本地降级: ${url}`, err)
          resolve({
            code: 200,
            message: '开发环境 Mock 数据响应成功',
            data: {
              mock: true,
              timestamp: Date.now(),
              url
            } as unknown as T
          })
          return
        }

        uni.showToast({
          title: '网络连接失败，请检查设置',
          icon: 'none'
        })
        reject(err)
      },
      complete: () => {
        if (options.showLoading) {
          uni.hideLoading()
        }
      }
    })
  })
}

export const http = {
  get: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) => 
    request<T>({ ...options, url, data, method: 'GET' }),
  post: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) => 
    request<T>({ ...options, url, data, method: 'POST' }),
  put: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) => 
    request<T>({ ...options, url, data, method: 'PUT' }),
  delete: <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) => 
    request<T>({ ...options, url, data, method: 'DELETE' })
}
