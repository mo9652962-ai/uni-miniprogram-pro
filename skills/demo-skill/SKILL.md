---
name: demo-skill
description: "微信小程序 AI 官方 MCP 规范样例：查询服务与业务处理"
version: 1.0.0
---

# 业务说明 (SKILL.md)

本 Skill 符合微信小程序官方【小程序 AI 开发模式 (beta)】的小程序 MCP 协议规范。

## 1. 业务流程与意图编排
- 用户意图：询问业务信息或请求处理特定任务。
- 模型根据 `mcp.json` 中声明的 Schema 与描述匹配合适的原子接口。
- 原子接口返回 `content`（供模型理解的文本事实）与 `structuredContent`（卡片渲染数据）。

## 2. 接口清单
- `queryServiceStatus`: 查询当前服务/商品状态
- `getRecommendedItems`: 获取系统推荐项
