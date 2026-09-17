const fs = require('fs')
const vm = require('vm')

const html = fs.readFileSync('D:/ai/opencode/共享文件可视化项目/public/index.html', 'utf8')
const m = html.match(/<script>([\s\S]*?)<\/script>/)
if (!m) { console.error('FAIL: no <script> block'); process.exit(1) }
const code = m[1]
try {
  new vm.Script(code)
  console.log('OK: inline script syntax valid,', code.split('\n').length, 'lines')
} catch (e) {
  console.error('FAIL: syntax error ->', e.message)
  process.exit(1)
}

// 关键 API 接线检查
const checks = [
  ["'/api/files'", 'loads files from backend'],
  ["'/api/groups'", 'loads groups from backend'],
  ["'/api/notes'", 'loads notes from backend'],
  ["'/api/config'", 'loads config from backend'],
  ["'/api/meta/'", 'annotation PATCH'],
  ["'/api/upload'", 'upload'],
  ['boot', 'boot function'],
  ['reloadFiles', 'reload function']
]
for (const [needle, desc] of checks) {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing', desc, '->', needle); process.exit(1) }
}
console.log('OK: all backend API wiring present')

// 确认 demo mock 仍保留（fallback 降级路径）
if (code.indexOf('var FILES = [') === -1) { console.error('FAIL: FILES mock removed'); process.exit(1) }
console.log('OK: demo mock fallback retained')

// 旧 alert 占位不应残留
for (const bad of ['真实项目中走 GET', 'alert(\'预览']) {
  if (code.indexOf(bad) !== -1) { console.error('FAIL: stale placeholder present:', bad); process.exit(1) }
}
console.log('OK: no stale placeholders')

// 批量选择功能接线检查
const batchChecks = [
  ['selectedIds', 'selection state'],
  ['function toggleSelect', 'toggleSelect'],
  ['function updateSelectBar', 'updateSelectBar'],
  ['function clearSelection', 'clearSelection'],
  ['function selectedFileList', 'selectedFileList'],
  ['card-select', 'card checkbox markup'],
  ['getElementById', 'DOM lookup'],
  ["getElementById('selectClearBtn')", 'bar: clear button wiring'],
  ["getElementById('selectGroupBtn')", 'bar: add-to-group button wiring']
]
for (const [needle, desc] of batchChecks) {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing', desc, '->', needle); process.exit(1) }
}
// HTML 中直接出现的元素（不在 script 内）
if (html.indexOf('id="selectBar"') === -1) { console.error('FAIL: selectBar element missing in HTML'); process.exit(1) }
if (html.indexOf('id="selectGroupBtn"') === -1) { console.error('FAIL: selectGroupBtn element missing in HTML'); process.exit(1) }
// card-select 由 JS 动态生成，应出现在 script 内而非 HTML 静态标记里
if (code.indexOf('class="card-select"') === -1) { console.error('FAIL: card-select markup missing in script'); process.exit(1) }
console.log('OK: batch selection wiring present')

// 旧的单文件 pickTarget 变量不应残留（已改为 pickTargets 数组）
if (/\bpickTarget\b(?!s)/.test(code)) { console.error('FAIL: stale pickTarget reference'); process.exit(1) }
console.log('OK: pickTarget migrated to pickTargets')

console.log('PASS: all checks done')