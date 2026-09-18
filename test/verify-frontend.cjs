const fs = require('fs')
const path = require('path')
const vm = require('vm')

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8')
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

// 上传目标目录接线
const uploadChecks = [
  ["'/api/dirs'", 'dirs API'],
  ['X-Upload-Dir', 'upload target dir header'],
  ['uploadDirSelect', 'upload dir select element'],
  ['uploadPickBtn', 'upload pick button'],
  ['uploadConfirmBtn', 'upload confirm button'],
  ['function openUploadModal', 'openUploadModal'],
  ['function doUpload', 'doUpload']
]
for (const [needle, desc] of uploadChecks) {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing', desc, '->', needle); process.exit(1) }
}
if (html.indexOf('id="uploadModal"') === -1) { console.error('FAIL: uploadModal element missing in HTML'); process.exit(1) }
if (html.indexOf('id="uploadDirSelect"') === -1) { console.error('FAIL: uploadDirSelect element missing in HTML'); process.exit(1) }
console.log('OK: upload target-dir wiring present')

// 删除功能接线
const deleteChecks = [
  ["method: 'DELETE'", 'delete method'],
  ['deleteConfirmBtn', 'delete confirm button'],
  ['function openDeleteConfirm', 'openDeleteConfirm']
]
for (const [needle, desc] of deleteChecks) {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing', desc, '->', needle); process.exit(1) }
}
if (html.indexOf('id="deleteModal"') === -1) { console.error('FAIL: deleteModal element missing in HTML'); process.exit(1) }
if (html.indexOf('id="deleteConfirmBtn"') === -1) { console.error('FAIL: deleteConfirmBtn element missing in HTML'); process.exit(1) }
console.log('OK: delete wiring present')

// 卡片操作按钮（hover-actions）需折行排列，避免窄卡片下与右上角勾选框重叠
if (!/\.hover-actions \{[\s\S]{0,160}flex-wrap: wrap[\s\S]{0,60}width: 70px/.test(html)) {
  console.error('FAIL: hover-actions 未折行（2×2），可能与勾选框重叠'); process.exit(1)
}
console.log('OK: hover-actions wraps (2x2)')

// 数据统计看板接线（顶部总览胶囊 + 选中大小）
const statsChecks = [
  ['function renderStats', 'renderStats'],
  ['function updateSelectBar', 'updateSelectBar'],
  ['formatSize(totalBytes)', 'total bytes calc'],
  ['selectSizeEl.textContent', 'selected-size display']
]
for (const [needle, desc] of statsChecks) {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing', desc, '->', needle); process.exit(1) }
}
if (html.indexOf('id="statsBar"') === -1) { console.error('FAIL: statsBar element missing in HTML'); process.exit(1) }
if (html.indexOf('id="selectSize"') === -1) { console.error('FAIL: selectSize element missing in HTML'); process.exit(1) }
console.log('OK: stats dashboard wiring present')

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