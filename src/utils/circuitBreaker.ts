/**
 * 生产级断路器 (Circuit Breaker)
 * 保护客户端与服务端，避免在高延迟或后端崩溃时雪崩
 * 三态状态机：CLOSED (正常) -> OPEN (熔断阻断) -> HALF_OPEN (半开试探)
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerOptions {
  failureThreshold?: number // 触发熔断的连续失败次数阈值（默认 5 次）
  recoveryTimeout?: number  // 熔断开启后的冷却等待时间（毫秒，默认 15000ms）
  successThreshold?: number // 半开状态下需要连续成功的次数（默认 2 次）
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failureCount = 0
  private successCount = 0
  private nextAttempt = Date.now()
  private readonly failureThreshold: number
  private readonly recoveryTimeout: number
  private readonly successThreshold: number

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5
    this.recoveryTimeout = options.recoveryTimeout ?? 15000
    this.successThreshold = options.successThreshold ?? 2
  }

  /** 当前断路器状态 */
  public getState(): CircuitState {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN'
      this.successCount = 0
      console.log('🔄 [CircuitBreaker] 冷却时间已过，断路器状态流转: OPEN -> HALF_OPEN (半开试探)')
    }
    return this.state
  }

  /** 请求前检查是否允许执行 */
  public canExecute(): boolean {
    const currentState = this.getState()
    if (currentState === 'OPEN') {
      return false
    }
    return true
  }

  /** 请求成功回调 */
  public recordSuccess(): void {
    const currentState = this.getState()
    if (currentState === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.reset()
        console.log('✅ [CircuitBreaker] 试探成功达标，断路器恢复闭合: HALF_OPEN -> CLOSED')
      }
    } else if (currentState === 'CLOSED') {
      this.failureCount = 0
    }
  }

  /** 请求失败回调 (网络超时、50x 错误等) */
  public recordFailure(): void {
    const currentState = this.getState()
    if (currentState === 'HALF_OPEN') {
      this.trip()
      console.warn('⚠️ [CircuitBreaker] 半开试探失败，断路器立即重新开启: HALF_OPEN -> OPEN')
    } else if (currentState === 'CLOSED') {
      this.failureCount++
      if (this.failureCount >= this.failureThreshold) {
        this.trip()
        console.warn(`🚨 [CircuitBreaker] 连续失败达到 ${this.failureThreshold} 次阈值，触发熔断: CLOSED -> OPEN`)
      }
    }
  }

  /** 触发熔断 */
  private trip(): void {
    this.state = 'OPEN'
    this.nextAttempt = Date.now() + this.recoveryTimeout
  }

  /** 重置断路器到正常闭合态 */
  public reset(): void {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.successCount = 0
  }
}

/** 全局网络请求单例断路器 */
export const defaultCircuitBreaker = new CircuitBreaker({
  failureThreshold: 4,
  recoveryTimeout: 12000,
  successThreshold: 2
})
