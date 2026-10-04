import { ENV } from '../config/env'
import { useUserStore } from '../store/user'
import { defaultCircuitBreaker } from './circuitBreaker'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface RequestOptions extends UniApp.RequestOptions {
  showLoading?: boolean
  loadingTitle?: string
  _isRetry?: boolean // 内部重试标识，避免递归死循环
}

// 无感刷新状态锁与重放等待队列
let isRefreshing = false
let refreshSubscribers: Array<(newToken: string) => void> = []

function subscribeTokenRefresh(cb: (newToken: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

/**
 * 执行双 Token 刷新操作（无感静默更新）
 */
async function doRefreshToken(userStore: ReturnType<typeof useUserStore>): Promise<string | null> {
  const rToken = userStore.refreshToken
  if (!rToken) return null

  const refreshUrl = `${ENV.baseUrl}/auth/refresh-token`

  return new Promise((resolve) => {
    uni.request({
      url: refreshUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-Client-Platform': 'mp-weixin'
      },
      data: {
        refreshToken: rToken
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data as any
          const newAccess = body.data?.accessToken || `new_mock_access_${Date.now()}`
          const newRefresh = body.data?.refreshToken || `new_mock_refresh_${Date.now()}`
          userStore.setTokens(newAccess, newRefresh)
          console.log('🔄 [Auth Refresh] 无感刷新 AccessToken 成功并持久化')
          resolve(newAccess)
        } else {
          console.warn('⚠️ [Auth Refresh] 刷新 Token 失败，需重新登录')
          resolve(null)
        }
      },
      fail: (err) => {
        // 开发模式下允许 Mock 刷新成功，便于无后端时验证无感刷新完整链路
        if (ENV.enableMock) {
          const newAccess = `new_mock_access_${Date.now()}`
          const newRefresh = `new_mock_refresh_${Date.now()}`
          userStore.setTokens(newAccess, newRefresh)
          console.log('🔄 [Auth Refresh Mock] 本地无感刷新模拟成功')
          resolve(newAccess)
          return
        }
        console.warn('⚠️ [Auth Refresh] 网络故障刷新失败:', err)
        resolve(null)
      }
    })
  })
}

/**
 * 阶段 3 商业级自建后端请求层：
 * 具备双 Token 无感刷新拦截队列、断路器异常熔断降级、全局统一错误处理
 */
export function request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  const userStore = useUserStore()

  // 1. 断路器（Circuit Breaker）前置拦截
  if (!defaultCircuitBreaker.canExecute()) {
    console.warn(`🚨 [CircuitBreaker] 接口处于熔断保护状态，快速降级: ${options.url}`)
    if (ENV.enableMock) {
      return Promise.resolve({
        code: 200,
        message: '接口熔断保护中，触发本地缓存降级',
        data: {
          mock: true,
          circuitBroken: true,
          timestamp: Date.now()
        } as unknown as T
      })
    }
    uni.showToast({
      title: '服务暂时不可用，已触发熔断保护',
      icon: 'none'
    })
    return Promise.reject(new Error('CircuitBreakerOpen'))
  }

  // 2. 组装请求 URL 与 Header
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
      success: async (res) => {
        // 3. HTTP 状态码拦截
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 成功请求上报断路器
          defaultCircuitBreaker.recordSuccess()

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
        } else if (res.statusCode === 401 && !options._isRetry) {
          // 4. 401 触发双 Token 无感静默刷新机制
          console.warn('⚠️ [Auth 401] AccessToken 过期，准备无感刷新重放:', url)

          // 若正在刷新，将当前请求排队挂起
          if (isRefreshing) {
            subscribeTokenRefresh((newToken: string) => {
              options.header = { ...options.header, Authorization: `Bearer ${newToken}` }
              options._isRetry = true
              resolve(request<T>(options))
            })
            return
          }

          // 首次进入 401：锁住并发并触发刷新
          isRefreshing = true

          try {
            const newToken = await doRefreshToken(userStore)
            if (newToken) {
              // 刷新成功：批量重放排队中的请求
              onRefreshed(newToken)
              // 重放当前请求
              options.header = { ...options.header, Authorization: `Bearer ${newToken}` }
              options._isRetry = true
              resolve(request<T>(options))
            } else {
              // 刷新失败：凭据彻底失效，清空并退出登录
              refreshSubscribers = []
              userStore.logout()
              uni.showModal({
                title: '登录已过期',
                content: '您的登录凭据已失效，请重新登录',
                showCancel: false,
                success: () => {
                  uni.switchTab({ url: '/pages/my/index' })
                }
              })
              reject(new Error('Unauthorized_RefreshFailed'))
            }
          } finally {
            isRefreshing = false
          }
        } else {
          // 502/503/504 等严重错误上报断路器
          if (res.statusCode >= 500) {
            defaultCircuitBreaker.recordFailure()
          }
          uni.showToast({
            title: `服务器异常 [${res.statusCode}]`,
            icon: 'none'
          })
          reject(new Error(`HTTP Status ${res.statusCode}`))
        }
      },
      fail: (err) => {
        // 网络超时或失败上报断路器
        defaultCircuitBreaker.recordFailure()

        // 开发模式下网络失败自动触发 Mock 兜底，便于无后端时调试
        if (ENV.enableMock) {
          console.warn(`[API Mock Fallback] 接口请求异常，触发本地降级: ${url}`, err)
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
