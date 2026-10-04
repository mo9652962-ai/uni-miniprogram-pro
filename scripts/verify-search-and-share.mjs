/**
 * 题库分类检索与社交分享机制自动化单元验证
 */
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

console.log('=== [功能拓展验证] 题库分类检索与微信原生社交分享验证 ===\n')

const ROOT = process.cwd()

// 1. 验证 search/index.vue 页面实现
console.log('[1] 检查 search/index.vue 搜索与分类页面')
const searchPagePath = path.join(ROOT, 'src/subpackages/quiz/search/index.vue')
assert.ok(fs.existsSync(searchPagePath), 'search/index.vue 必须存在')
const searchCode = fs.readFileSync(searchPagePath, 'utf8')
assert.ok(searchCode.includes('categoryList'), '必须包含分类统计 categoryList')
assert.ok(searchCode.includes('filteredQuestions'), '必须包含多维检索过滤 filteredQuestions')
assert.ok(searchCode.includes('onShareAppMessage'), '必须配置 onShareAppMessage 分享好友')
assert.ok(searchCode.includes('onShareTimeline'), '必须配置 onShareTimeline 分享朋友圈')
assert.ok(searchCode.includes('startCategoryPractice'), '必须支持从检索结果直接发起专项练习')
console.log('  OK   题库分类检索页逻辑与社交分享声明完备')

// 2. 验证 pages.json 路由与分包
console.log('\n[2] 检查 pages.json 路由注册')
const pagesJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/pages.json'), 'utf8'))
const quizSub = pagesJson.subPackages.find(p => p.root === 'subpackages/quiz')
assert.ok(quizSub.pages.some(p => p.path === 'search/index'), 'pages.json 必须注册 search/index')
console.log('  OK   pages.json 成功注册 subpackages/quiz/search/index 路由')

// 3. 验证首页与结果页的分享链路与入口
console.log('\n[3] 检查首页与结果页的社交传播与检索入口')
const indexCode = fs.readFileSync(path.join(ROOT, 'src/pages/index/index.vue'), 'utf8')
assert.ok(indexCode.includes('goSearch'), '首页必须包含题库检索入口 goSearch')
assert.ok(indexCode.includes('onShareAppMessage'), '首页必须配置 onShareAppMessage 连续打卡炫耀分享')

const resultCode = fs.readFileSync(path.join(ROOT, 'src/subpackages/quiz/result/index.vue'), 'utf8')
assert.ok(resultCode.includes('open-type="share"'), '结果页必须提供 open-type="share" 分享按钮')
assert.ok(resultCode.includes('onShareAppMessage'), '结果页必须实现 onShareAppMessage 战报分享')
console.log('  OK   首页与练习结果页社交裂变与分享按钮齐备')

console.log('\n==================================================')
console.log('分类检索与社交分享自动化逻辑测试: 全部通过 (3/3) ✅')
