# 微信云开发 CloudBase 规范与数据架构 (阶段 2)

本项目已实现标准微信云开发 (CloudBase) 服务端体系，涵盖云函数、云数据库与客户端双轨适配。

---

## 一、云数据库集合设计 (JSON Document Schema)

云数据库采用类似 MongoDB 的 JSON 文档存储，设计 3 大核心集合：

### 1. `users`（用户档案集合）
- `_id`: 字符串，文档唯一主键
- `_openid`: 字符串，由微信服务端自动注入的用户权威唯一标识
- `nickName`: 字符串，用户昵称
- `avatarUrl`: 字符串，头像 URL / 云存储 FileID
- `totalPracticed`: 数值，累计做题总数
- `totalCorrect`: 数值，累计答对总数
- `streakDays`: 数值，当前连续打卡天数
- `lastCheckinDate`: 字符串（格式 `YYYY-MM-DD`），最近一次打卡日期
- `createTime`: 毫秒时间戳
- `updateTime`: 毫秒时间戳

**推荐索引**：`_openid`（唯一索引）。

---

### 2. `questions`（题库集合）
- `_id`: 字符串，题目唯一编号（如 `q001`）
- `stem`: 字符串，题目题干
- `options`: 字符串数组，4 个选项
- `answer`: 数值（0 ~ 3），正确答案对应 options 索引
- `explain`: 字符串，题目权威精讲解析
- `tag`: 字符串，分类标签（如 `单片机`、`电路基础`、`PCB`、`通信`、`RTOS`）
- `order`: 数值，排序权重
- `createTime`: 毫秒时间戳

**数据种子**：位于 `cloudfunctions/questions_seed.json`（已内置 16 道精选题）。  
**导入方式**：在开发者工具【云开发控制台】→【数据库】→【questions 集合】点击「导入」，选择该 JSON 文件即可。

---

### 3. `practice_records`（练习记录集合）
- `_id`: 字符串，记录唯一标识
- `_openid`: 字符串，提交记录的用户 openid
- `date`: 字符串（`YYYY-MM-DD`），练习日期
- `total`: 数值，本轮练习总题数
- `correct`: 数值，本轮答对题数
- `accuracy`: 数值（0 ~ 100），正确率百分比
- `durationSec`: 数值，做题总用时（秒）
- `tag`: 字符串，练习标签
- `wrongDetails`: 数组，错题明细列表
- `createTime`: 毫秒时间戳

**推荐索引**：`_openid + createTime`（复合索引）。

---

## 二、云函数清单 (`cloudfunctions/`)

| 云函数名 | 职责 | 核心机制 |
|:---|:---|:---|
| **`login`** | 用户安全鉴权与档案自愈初始化 | 服务端 `cloud.getWXContext().OPENID`，防伪造 |
| **`getQuestions`** | 题库拉取（支持分页与随机抽样） | `sample({ size })` 聚合抽题 / `skip + limit` 分页查询 |
| **`syncPractice`** | 提交练习记录与原子累加打卡统计 | `db.command.inc` 原子累加，跨日/断签逻辑服务端裁决 |
| **`getUserStats`** | 获取个人打卡看板与近 10 条记录 | 聚合统计 + 首页看板驱动 |

---

## 三、部署命令（开通正式云环境后）

当拥有正式小程序并开通云开发环境后，可直接在开发者工具右键部署，或通过官方 DevTools MCP 一键部署：

```bash
# 示例：通过 DevTools MCP 部署 getQuestions
# tool: cloud_fn_deploy
# 参数: { "appid": "wxe264...", "env": "your-env-id", "path": "D:\\uni-miniprogram-pro\\cloudfunctions\\getQuestions" }
```
