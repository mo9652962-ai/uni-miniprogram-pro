/**
 * 阶段 2：微信云开发 CloudBase 服务端与客户端链路单元验证
 */
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

console.log('=== [阶段 2 验证] 微信云开发 CloudBase 全栈链路检查 ===\n')

const ROOT = process.cwd()
const CLOUD_DIR = path.join(ROOT, 'cloudfunctions')

// 1. 验证 4 大云函数目录与结构
const expectedFunctions = ['login', 'getQuestions', 'syncPractice', 'getUserStats']
for (const fn of expectedFunctions) {
  const dir = path.join(CLOUD_DIR, fn)
  assert.ok(fs.existsSync(dir), `云函数目录必须存在: ${fn}`)
  
  const pkgPath = path.join(dir, 'package.json')
  assert.ok(fs.existsSync(pkgPath), `云函数 ${fn} 必须包含 package.json`)
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  assert.ok(pkg.dependencies && pkg.dependencies['wx-server-sdk'], `${fn} 必须依赖 wx-server-sdk`)

  const codePath = path.join(dir, 'index.js')
  assert.ok(fs.existsSync(codePath), `云函数 ${fn} 必须包含 index.js 入口`)
  const code = fs.readFileSync(codePath, 'utf8')
  assert.ok(code.includes('exports.main'), `${fn} 必须导出 exports.main`)
  assert.ok(code.includes('cloud.getWXContext'), `${fn} 必须包含安全上下文提取 cloud.getWXContext()`)
  console.log(`  OK   云函数 [${fn}] 规范与代码结构完整`)
}

// 2. 验证题库种子数据 (Seed)
const seedPath = path.join(CLOUD_DIR, 'questions_seed.json')
assert.ok(fs.existsSync(seedPath), '必须生成 questions_seed.json 种子文件')
const seeds = JSON.parse(fs.readFileSync(seedPath, 'utf8'))
assert.strictEqual(seeds.length, 16, '种子题库应包含 16 道精选题')
for (const item of seeds) {
  assert.ok(item._id && item.stem && item.options && item.explain && item.tag, `题目结构不完整: ${item._id}`)
  assert.strictEqual(item.options.length, 4, `题目 ${item._id} 必须有 4 个选项`)
  assert.ok(item.answer >= 0 && item.answer <= 3, `题目 ${item._id} 答案索引越界`)
}
console.log('  OK   题库种子数据 questions_seed.json (16道题目) 结构与索引合法')

// 3. 验证文档与 Schema 设计
const readmePath = path.join(CLOUD_DIR, 'README.md')
assert.ok(fs.existsSync(readmePath), '必须包含 cloudfunctions/README.md')
const readme = fs.readFileSync(readmePath, 'utf8')
assert.ok(readme.includes('users'), '文档必须包含 users 集合设计')
assert.ok(readme.includes('questions'), '文档必须包含 questions 集合设计')
assert.ok(readme.includes('practice_records'), '文档必须包含 practice_records 集合设计')
console.log('  OK   云数据库 3 大核心集合规范文档 (README.md) 齐备')

// 4. 验证前端 API 契约与分包配置
const quizApiPath = path.join(ROOT, 'src/services/quizApi.ts')
assert.ok(fs.existsSync(quizApiPath), '必须创建 src/services/quizApi.ts')
const quizApiCode = fs.readFileSync(quizApiPath, 'utf8')
assert.ok(quizApiCode.includes('apiLogin'), 'quizApi 必须导出 apiLogin')
assert.ok(quizApiCode.includes('apiGetQuestions'), 'quizApi 必须导出 apiGetQuestions')
assert.ok(quizApiCode.includes('apiSyncPractice'), 'quizApi 必须导出 apiSyncPractice')
assert.ok(quizApiCode.includes('apiGetUserStats'), 'quizApi 必须导出 apiGetUserStats')
console.log('  OK   前端业务云服务层 quizApi.ts 接口定义完备')

// 5. 验证 pages.json 中下拉刷新与触底分页配置
const pagesCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/pages.json'), 'utf8'))
const historyPage = pagesCfg.subPackages
  .find(p => p.root === 'subpackages/quiz')
  ?.pages.find(p => p.path === 'history/index')
assert.ok(historyPage?.style?.enablePullDownRefresh, '历史记录页必须启用下拉刷新')
assert.strictEqual(historyPage?.style?.onReachBottomDistance, 50, '历史记录页必须配置触底加载阈值 onReachBottomDistance')
console.log('  OK   页面路由配置已生效 enablePullDownRefresh 与 onReachBottomDistance')

console.log('\n========================================')
console.log('阶段 2 云开发全栈规范验证: 全部通过 (5/5) ✅')
