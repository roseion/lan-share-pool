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

console.log('PASS: all checks done')