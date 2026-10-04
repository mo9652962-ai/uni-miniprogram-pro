# uni-miniprogram-pro

现代化跨端小程序脚手架（Vue 3 + TypeScript + Pinia + Wot Design Uni + 双轨架构）

---

## 架构特性与三模块落地对齐

### 模块 1：现代化跨端前端
- **内核驱动**：Vite 5 + Vue 3 组合式 API (Composition API) + TypeScript
- **状态管理**：Pinia（`src/store/user.ts`，自动同步本地缓存 `uni.setStorageSync`）
- **UI 组件库**：Wot Design Uni（配置 `pages.json` 中的 `easycom`，支持组件自动按需加载）

### 模块 2：小程序特有运行机制
- **生命周期链路捕获**：
  - 应用级：`src/App.vue`（`onLaunch`, `onShow`, `onHide`, 自动版本更新检测）
  - 页面级：`src/pages/index/index.vue`（`onLoad`, `onShow`, `onReady`, `onPullDownRefresh`）
  - 组件级：Vue 3 原生 `onMounted`
- **双线程架构防护**：
  - 首页包含高频 `setData` 批量合并演示，避免跨线程通信队列阻塞导致掉帧。
- **2MB 限制与分包策略**：
  - 主包仅保留 TabBar 核心页（`pages/index`, `pages/my`）
  - 次级功能全部拆入独立分包（`subpackages/tools`, `subpackages/order`）
  - 配置 `preloadRule`：进入首页静默预下载工具分包，首屏速度与体积双赢。

### 模块 3：服务端双轨架构
- **轨 A：微信云开发（CloudBase）**：
  - `src/services/cloud.ts` 封装安全初始化、免鉴权云函数调用、云存储上传。
  - `cloudfunctions/login/index.js` 服务端信任根提取 `wxContext.OPENID`。
- **轨 B：自建后端 API 封装**：
  - `src/utils/request.ts` 基于 `uni.request` 封装拦截器：
    - 自动追加 `Bearer Token` 与客户端标记 Header
    - 统一处理 HTTP 状态码（401 自动触发退出并拦截重定向）
    - 开发模式下带自动 Mock 兜底，无后端时依然可流畅开发。
- **环境配置**：`src/config/env.ts` 区分开发与生产合法域名白名单说明。

---

## 常用命令

```bash
# 安装依赖
npm install

# 微信小程序端开发热重载（产物生成在 dist/dev/mp-weixin）
npm run dev:mp-weixin

# 微信小程序端生产编译打包（产物生成在 dist/build/mp-weixin）
npm run build:mp-weixin

# H5 端本地运行预览（浏览器打开 http://localhost:3000）
npm run dev:h5
```

---

## 微信开发者工具导入指南

1. 打开【微信开发者工具】。
2. 点击【导入项目】。
3. 项目目录选择：
   - 开发调试时选择：`D:\uni-miniprogram-pro\dist\dev\mp-weixin`
   - 正式发布打包时选择：`D:\uni-miniprogram-pro\dist\build\mp-weixin`
4. AppID 填写你自己的小程序 AppID（`src/manifest.json` 的 `mp-weixin.appid`）。
5. 在本地设置中勾选：`不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书`（开发环境调试自建 API 必需）。
