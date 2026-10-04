# 阶段 3 完成报告：小程序商业实战核心链路闭环

> 项目：`D:\uni-miniprogram-pro`  
> 日期：2026-10-04  
> 状态：自建 API 鉴权 + 微信支付 V3 状态机与退款 + 全局骨架屏与断路器熔断全部落地并验证通过 ✅

---

## 一、阶段 3 核心架构全景

```
D:\uni-miniprogram-pro
├── src/utils/
│   ├── circuitBreaker.ts              # 【生产级断路器】三态状态机 (CLOSED -> OPEN -> HALF_OPEN)
│   └── request.ts                     # 【商业请求层】双 Token 无感静默刷新队列 + 熔断降级
├── src/services/
│   └── pay.ts                         # 【微信支付 V3】统一下单 + 签名包 + 轮询验签 + 状态机退款
├── src/components/common/
│   └── SkeletonLoader.vue             # 【通用骨架屏】基于 wd-skeleton 封装卡片/个人/列表多场景
├── src/subpackages/order/pay/index.vue# 【收银台分包】骨架屏加载、商品选购、微信支付调起、订单管理与退款
├── docs/screenshots/04-checkout.png   # 【模拟器截图】官方 DevTools MCP 真实截取的收银台画面
└── docs/stage3-commercial-complete.md # 阶段 3 完整技术交付报告
```

---

## 二、自建 API 鉴权机制（双 Token 无感静默刷新）

传统仅靠一个 Token 的模式容易导致频繁掉线或安全风险。阶段 3 实现了企业级**双 Token + 拦截器并发队列刷新**体系：

```
客户端 (uni-app)               自建 API 服务端              微信官方服务器
   │                                  │                           │
   │─── 1. wx.login 获取 code ────────│──────────────────────────▶│
   │◀── 2. 返回临时 code ─────────────│───────────────────────────│
   │                                  │                           │
   │─── 3. POST /auth/wechat-login ──▶│                           │
   │       { code }                   │── 4. code2Session ───────▶│
   │                                  │◀─ 5. openid, session_key ─│
   │                                  │ (生成或查找用户)          │
   │                                  │ (签发 accessToken 双Token)│
   │◀── 6. 返回 { accessToken,        │                           │
   │       refreshToken, user } ──────│                           │
   │                                  │                           │
   │─── 7. 携带 accessToken 请求 ─────▶│ (业务鉴权通过)            │
   │                                  │                           │
   │  [AccessToken 过期 (401)]        │                           │
   │                                  │                           │
   │─── 8. 401 拦截器挂起并发请求 ────│                           │
   │─── 9. POST /auth/refresh-token ─▶│ (验签 refreshToken)       │
   │◀── 10. 派发新 accessToken ───────│                           │
   │─── 11. 重放刚才被挂起的所有请求 ─▶│ (无感完成数据交互)        │
```

### 核心防并发与防死锁设计
- `isRefreshing` 锁：当页面同时发起 5 个请求且全部 401 时，只触发**单次**刷新请求；
- `refreshSubscribers` 队列：其余 4 个请求被封装为 Promise 挂起等待；
- 刷新完成后按序广播新 Token 并自动重放；若长效 RefreshToken 彻底失效，清空队列并强制安全退出登录。

---

## 三、微信支付 V3 全时序与退款状态机

### 1. 支付业务时序（JSAPI 支付）
1. **统一下单 (`/v3/pay/transactions/jsapi`)**：前端提交购买项，后端生成全局唯一商户订单号 `out_trade_no`，调微信统一下单获取 `prepay_id`；
2. **生成签名包**：后端使用商户 APIv3 私钥对 `appId, timeStamp, nonceStr, package="prepay_id=xxx"` 进行 RSA-SHA256 签名，生成支付参数对象下发；
3. **调起原生收银台**：客户端调用 `uni.requestPayment({ timeStamp, nonceStr, package, signType: 'RSA', paySign })`；
4. **【安全红线】服务端入账闭环**：
   - 前端 `requestPayment` 成功**绝不能**直接作为发货或激活会员的唯一凭证（前端环境易受篡改或因网络中断导致假象）；
   - 必须依靠服务端接收微信支付官方 Webhook 异步通知验签，或由前端调用 `apiPollOrderStatus` 轮询后端确认订单状态变更为 `PAID`。

### 2. 订单状态机与退款链路
```
[创建订单] ──▶ PENDING (待支付)
                  │
          (uni.requestPayment)
                  │
                  ▼
              PAID (已支付，会员权益激活)
                  │
            (申请退款 handleRefund)
                  │
                  ▼
              REFUNDING (退款中)
                  │
          (微信退款回调确认)
                  │
                  ▼
              REFUNDED (已退款，会员权益安全收回)
```

---

## 四、全局骨架屏与断路器异常熔断

### 1. 通用骨架屏组件 (`SkeletonLoader.vue`)
- 基于 Wot Design Uni `<wd-skeleton>` 封装；
- 支持 `card`（卡片）、`profile`（个人中心头像+统计）、`list`（列表）三大多频场景；
- 具备 `gradient` 呼吸动效与渐变进场动画，有效消除弱网环境下的白屏焦虑。

### 2. 生产级三态断路器 (`circuitBreaker.ts`)
- **CLOSED (正常闭合)**：正常放行所有 API 请求；若连续失败（超时或 50x 错误）达到 4 次阈值，立即跳闸进入 `OPEN`；
- **OPEN (熔断阻断)**：直接拦截并快速返回本地降级缓存（不把请求打向后端造成雪崩），同时开启 12 秒冷却计时；
- **HALF_OPEN (半开试探)**：冷却期过后允许单次试探请求；若连续 2 次请求成功则自愈闭合重置为 `CLOSED`，若失败则退回 `OPEN`。

---

## 五、测试验收交付证据

### 1. 自动化回归测试
```bash
$ node scripts/verify-stage3-commercial.mjs
=== [阶段 3 验证] 商业实战（API鉴权 + 微信支付 + 断路器 + 骨架屏）检查 ===
[1] 断路器 CircuitBreaker 状态机流转测试
  OK   断路器 CLOSED -> OPEN -> HALF_OPEN -> CLOSED 状态机流转正确
[2] 自建 API 鉴权机制（双 Token 无感刷新契约）
  OK   双 Token 无感刷新与拦截器防死锁重放设计完整
[3] 微信支付 V3 时序与状态机契约
  OK   微信支付统一下单、参数签名、入账轮询、极速退款链路齐备
[4] 全局通用骨架屏组件
  OK   SkeletonLoader.vue 通用骨架屏封装规范
[5] 分包路由与会员收银台页面
  OK   pages.json 包含 subpackages/order/pay/index 分包路由
阶段 3 商业实战架构自动化测试: 全部通过 (5/5) ✅

$ npx vue-tsc --noEmit -p tsconfig.json
TypeScript 0 错误 ✅

$ npm run build:mp-weixin
DONE  Build complete.
```

### 2. 真实真机模拟器 E2E 截图验证
通过官方 DevTools MCP 真实拉起并导航到 `/subpackages/order/pay/index` 截取图像（`docs/screenshots/04-checkout.png`），并使用多模态视觉模型交叉检验：
- **顶部会员卡片**：标准学习者身份，黄色高亮提示升级权益；
- **三大商品卡片**：月度 Pro (¥19.9)、年度豪享 (¥99.0)、专项包 (¥39.0)，价格、划线原价与标签对齐完整；
- **安全说明条**：微信支付 V3 加密、Webhook 异步防重、极速退款状态机；
- **底部行动条**：应付金额与「立即支付升级」常驻吸底；
- **结论**：**无任何白屏或异常渲染，界面符合商业级发布标准**。
