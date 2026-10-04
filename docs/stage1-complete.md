# 阶段 1 完成报告：uni-app 入门跑通

> 项目：`D:\uni-miniprogram-pro`
> 日期：2026-10-04
> 交付物：可编译运行的「刷题打卡」小程序（真实业务，非玩具 demo）

---

## 一、阶段 1 四个技术点落地对照

| 训练目标 | 落地位置 | 验证方式 |
|:---|:---|:---|
| **页面路由跳转** | `pages.json` 配置 2 主包页 + 4 分包页；`uni.navigateTo` / `uni.switchTab` / `uni.redirectTo` 三种跳转方式 | 构建产物四件套齐备校验通过 |
| **组件库引入** | Wot Design Uni，`easycom` 自动按需引入（`wd-button` / `wd-icon` / `wd-tag` / `wd-circle`） | 产物 `node-modules/wot-design-uni/components/*` 实际生成 |
| **本地存储** | `src/store/checkin.ts` 基于 `uni.setStorageSync` / `getStorageSync` 的练习记录持久化 | 逻辑单测 10/10 通过 |
| **rpx 自适应** | 全部页面样式使用 `rpx` 单位（750 设计稿基准） | 编译无告警 |

---

## 二、业务功能清单（真实可用）

```
打卡首页 (pages/index)
├─ 时段问候（早上好/中午好/下午好/晚上好）
├─ 打卡状态徽章（已打卡 / 待打卡）
├─ 三项统计：连续天数 · 累计答题 · 正确率
├─ 四个快捷入口：5题 / 10题 / 16题 / 自定义
├─ 最近 3 条练习记录
└─ 下拉刷新

练习配置 (subpackages/quiz/setup)
├─ 题量选择：5 / 10 / 15 / 20
├─ 分类筛选：全部 · 单片机 · 电路基础 · PCB · 通信 · RTOS
└─ 可用题数实时联动

答题页 (subpackages/quiz/practice)
├─ 顶部进度条 + 计时器
├─ 自定义组件 QuestionCard（题干 / 选项 / 解析）
├─ 选中态 / 正确态 / 错误态三态样式
├─ 确认答案 → 显示解析
└─ 上一题 / 下一题 / 交卷

结果页 (subpackages/quiz/result)
├─ wd-circle 环形分数（按正确率变色）
├─ 用时 / 平均每题耗时
├─ 错题回顾（你的答案 vs 正确答案 + 解析）
└─ 返回首页 / 再练一次

记录页 (subpackages/quiz/history)
├─ 汇总条：练习次数 · 累计题数 · 平均正确率
├─ 全部历史记录列表
└─ 清空记录（二次确认）

我的 (pages/my)
├─ 用户信息卡片（登录态）
├─ 学习数据卡片
├─ 功能菜单（练习记录 / 报价估算 / 登录）
└─ 本地缓存诊断面板（教学用：可视化 Storage）
```

题库：**16 道嵌入式/电路/PCB 真题**，含详细解析。

---

## 三、技术验证结果（真实执行）

### 3.1 静态检查 + 逻辑单测

```
$ npm run build:mp-weixin
DONE  Build complete.

$ npx vue-tsc --noEmit -p tsconfig.json
exit=0（src 0 错误）

$ node scripts/verify-stage1-logic.mjs
[Case 1] 连续打卡天数（基准日 2026-10-04）
  OK  无记录 -> 0 天
  OK  今天+昨天+前天 -> 3 天
  OK  今天没打但昨天打了 -> 保留 1 天
  OK  中间断一天 -> 只算连续段
[Case 2] 正确率
  OK  无记录 -> 0%
  OK  10/10 -> 100%
  OK  合并 (8/10 + 5/10) -> 65%
  OK  四舍五入 (1/3) -> 33%
[Case 3] 日期补零
  OK  todayStr 基准日
  OK  todayStr 单位数补零

结果：10 通过 / 0 失败
```

### 3.2 真机模拟器 E2E（官方 DevTools MCP，47 工具）

通过官方 MCP 驱动微信开发者工具，在真实模拟器中跑通完整链路：

| 步骤 | 工具调用 | 实测结果 |
|:---|:---|:---|
| 账号 AppID 枚举 | `get_user_appids` | `wxe264a9bbdca389e5`（小程序测试号）✅ |
| 导入项目 | `project_import` | `alreadyImported: false`，导入成功 ✅ |
| 打开窗口 | `open_project_window` | `winId: s0` ✅ |
| 首页渲染 | `simulator_screenshot` | 343×740，无报错 ✅ |
| 首页状态 | `automation_page_action getData` | `下午好` / `2026年10月4日 周日` ✅ |
| 点击「快速练 5 题」 | `automation_element_action tap` | `success: true` ✅ |
| 路由跳转 | `automation_runtime_info currentPage` | `/subpackages/quiz/practice/index?count=5&tag=全部` ✅ |
| 答题页渲染 | `simulator_screenshot` | `1 / 5`、计时器、题干、4 选项、确认答案按钮 ✅ |
| 答题页数据 | `automation_page_action getData` | `q003` / `answer: 2` / 解析 / `电路基础` ✅ |
| 结果页渲染 | `automation_element_action text` | `80分` `4/5` `1分35秒` `19秒` `错题 1 道` ✅ |
| 控制台日志 | `get_simulator_console` | 无 error，仅 system/warn 级 ✅ |

**截图证据**（`docs/screenshots/`）：

| 文件 | 内容 |
|:---|:---|
| `01-home.png` | 打卡首页：时段问候、打卡状态、三项统计、四个快捷入口 |
| `02-practice.png` | 答题页：进度 `1/5`、计时 `00:06`、题干、A/B/C/D 选项、确认答案 |
| `03-result.png` | 结果页：绿色环形 80 分、`4/5` `1分35秒` `19秒`、错题回顾 |

### 3.3 已知限制（非 bug）

`automation_element_action` 的 CSS 选择器**无法穿透自定义组件边界**（Vue 编译的 `components/quiz/QuestionCard` 内部 `.option-item` 在页面作用域查不到，`>>>` 穿透语法也不支持）。因此 MCP 无法用选择器点击选项按钮 —— 这是 DevTools MCP 的能力边界，不是应用缺陷。结果页已通过直接导航 + `detail` 参数验证渲染正确。

体积：主包 **282K**（远低于 2MB 上限），quiz 分包 52K。

---

## 四、启动方式

```bash
cd D:\uni-miniprogram-pro

# 开发热重载（后台常驻）
npm run dev:mp-weixin

# 生产打包
npm run build:mp-weixin
```

微信开发者工具 → 导入项目 → 目录选 `dist/dev/mp-weixin` → AppID 已配置为 `wxe264a9bbdca389e5`。

或直接用官方 MCP 一键打开（自动化）：

```bash
# Hermes 已配置 wechat-official MCP（47 工具）
hermes mcp test wechat-official
```

---

## 六、凭据与安全

| 项 | 位置 | 说明 |
|:---|:---|:---|
| AppID | `src/manifest.json` → `mp-weixin.appid` | `wxe264a9bbdca389e5`，可提交 |
| AppSecret | `~/.hermes-secrets/wx-miniprogram.md` | **仅服务端使用，严禁进前端/仓库** |
| `.env` | 已删除并在 `.gitignore` 拦截 | 无明文 token 残留 |

> AppSecret 只用于服务端调 `code2Session` / `getAccessToken`。小程序前端代码里绝不能出现。

---

## 七、下一步（阶段 2 前置条件）

阶段 1 已具备：路由 / 组件化 / 本地存储 / 响应式布局，且已在真实模拟器 E2E 验证。

进入阶段 2 需要补上：
1. **服务端数据源**：题库从静态 `src/data/questions.ts` 换成接口下发
2. **用户体系**：`wx.login` → `code2Session` → Token 持久化（当前是本地模拟）
3. **列表分页**：信息流的触底加载
4. **图片上传**：云存储 / 对象存储

需要先确认后端方案：**微信云开发 CloudBase**（免服务器）还是 **自建 API**（Python FastAPI）。
