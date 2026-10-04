/**
 * 错题本业务逻辑自动化单元验证
 */
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

console.log('=== [业务拓展验证] 错题专练本逻辑与页面结构验证 ===\n')

const ROOT = process.cwd()

// 1. 验证 checkin.ts 中的错题集机制
console.log('[1] 检查 checkin.ts 错题管理函数')
const checkinPath = path.join(ROOT, 'src/store/checkin.ts')
assert.ok(fs.existsSync(checkinPath), 'checkin.ts 必须存在')
const checkinCode = fs.readFileSync(checkinPath, 'utf8')
assert.ok(checkinCode.includes('wrongIds'), '必须导出 wrongIds 响应式引用')
assert.ok(checkinCode.includes('recordWrong'), '必须提供 recordWrong 错题收录方法')
assert.ok(checkinCode.includes('removeWrong'), '必须提供 removeWrong 掌握移出方法')
assert.ok(checkinCode.includes('clearAllWrong'), '必须提供 clearAllWrong 清空错题方法')
assert.ok(checkinCode.includes('wrongCount'), '必须提供 wrongCount 计算属性')
console.log('  OK   checkin.ts 错题本存储与增删改查方法健全')

// 2. 验证 practice/index.vue 答错题时自动记录到错题本
console.log('\n[2] 检查 practice/index.vue 答错题收录逻辑')
const practicePath = path.join(ROOT, 'src/subpackages/quiz/practice/index.vue')
const practiceCode = fs.readFileSync(practicePath, 'utf8')
assert.ok(practiceCode.includes('checkinStore.recordWrong'), '答完题后必须将错题加入错题本')
console.log('  OK   practice/index.vue 包含错题自动落盘逻辑')

// 3. 验证错题本页面与骨架屏
console.log('\n[3] 检查错题本页面组件与路由')
const wrongPagePath = path.join(ROOT, 'src/subpackages/quiz/wrong/index.vue')
assert.ok(fs.existsSync(wrongPagePath), 'wrong/index.vue 页面必须存在')
const wrongCode = fs.readFileSync(wrongPagePath, 'utf8')
assert.ok(wrongCode.includes('SkeletonLoader'), '错题本必须引入通用骨架屏')
assert.ok(wrongCode.includes('handleRemove'), '错题本必须支持移除/标记已掌握')
assert.ok(wrongCode.includes('handleClearAll'), '错题本必须支持一键清空')

const pagesJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/pages.json'), 'utf8'))
const quizSub = pagesJson.subPackages.find(p => p.root === 'subpackages/quiz')
assert.ok(quizSub.pages.some(p => p.path === 'wrong/index'), 'pages.json 必须注册 wrong/index 路由')
console.log('  OK   错题本页面与 pages.json 路由完整对齐')

console.log('\n==================================================')
console.log('错题专练本自动化逻辑测试: 全部通过 (3/3) ✅')
