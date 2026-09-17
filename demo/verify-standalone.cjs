const fs = require('fs')
const vm = require('vm')

const html = fs.readFileSync('D:/ai/opencode/共享文件可视化项目/demo/standalone.html', 'utf8')
const m = html.match(/<script>([\s\S]*?)<\/script>/)
if (!m) { console.error('FAIL: no <script> block found'); process.exit(1) }

const code = m[1]
try {
  new vm.Script(code)
  console.log('OK: inline script syntax valid,', code.split('\n').length, 'lines')
} catch (e) {
  console.error('FAIL: syntax error ->', e.message)
  process.exit(1)
}

// 1. 31 个 mock 文件
const ids = [...code.matchAll(/id: '(\d+)'/g)].length
const cats = [...code.matchAll(/category: '(\w+)'/g)].map(x => x[1])
const uniqueCats = [...new Set(cats)]
if (ids !== 31) { console.error('FAIL: expected 31 files, got', ids); process.exit(1) }
console.log('OK: 31 mock files')

// 2. 文件分类映射
if (uniqueCats.sort().join(',') !== 'archive,code,document,image,other,video') {
  console.error('FAIL: categories mismatch ->', uniqueCats); process.exit(1)
}
console.log('OK: 6 categories')

// 3. 分组功能关键标识
const groupChecks = [
  "id: 'g1'", "id: 'g2'", 'openGroupPick', 'renderGroups', 'newGroupQuickInput',
  'groupEditModal', 'saveGroups', 'groupsOfFile', 'state.groups'
]
groupChecks.forEach(function (needle) {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing group marker:', needle); process.exit(1) }
})
console.log('OK: group feature markers present (' + groupChecks.length + ')')

// 4. 上传功能标识
const uploadChecks = ['fileInput', 'uploadBtn', 'footerUploadBtn', 'URL.createObjectURL', 'handleFiles']
uploadChecks.forEach(function (needle) {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing upload marker:', needle); process.exit(1) }
})
console.log('OK: upload feature markers present (' + uploadChecks.length + ')')

console.log('PASS: all checks done')