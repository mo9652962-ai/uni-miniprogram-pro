/**
 * 环境配置文件
 * 遵循模块 3 规范：区分开发环境（可勾选不校验合法域名）与生产环境（微信后台配置合法 request 域名）
 */

export interface EnvConfig {
  baseUrl: string
  cloudEnvId?: string
  enableMock: boolean
  timeout: number
}

// Vite 环境变量：开发模式为 'development'，生产构建为 'production'
const isDev = import.meta.env.MODE !== 'production'

export const ENV: EnvConfig = {
  // 开发环境通常使用本地局域网 IP 或内网穿透域名
  // 生产环境必须是经过 ICP 备案且支持 HTTPS (TLS 1.2+) 的正式合法域名
  baseUrl: isDev 
    ? 'http://127.0.0.1:8000/api/v1' 
    : 'https://api.yourdomain.com/api/v1',
  
  // 微信云开发环境 ID（如有开通可在微信开发者工具 -> 云开发控制台获取）
  cloudEnvId: 'cloud1-prod-env-id',

  // 是否在接口失败时降级回退到本地 Mock 数据
  enableMock: true,
  
  timeout: 10000
}

/**
 * 说明：微信开发者工具的 MCP 能力（wechatide mcp --token=xxx）
 * 属于「开发工具侧」的 Agent 自动化协议，运行在 PC 端 IDE 进程，
 * 不参与小程序运行时代码，因此不在此文件中配置。
 * 配置位置：Hermes 的 ~/.hermes/config.yaml -> mcp_servers
 */
