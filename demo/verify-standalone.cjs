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

// 1. 36 个 mock 文件
const ids = [...code.matchAll(/id: '(\d+)'/g)].length
const cats = [...code.matchAll(/category: '(\w+)'/g)].map(x => x[1])
const uniqueCats = [...new Set(cats)]
if (ids !== 36) { console.error('FAIL: expected 36 files, got', ids); process.exit(1) }
console.log('OK: 36 mock files')
if (uniqueCats.sort().join(',') !== 'app,archive,code,document,image,other,video') {
  console.error('FAIL: categories mismatch ->', uniqueCats); process.exit(1)
}
console.log('OK: 7 categories')

// 2. "全部" tab
;["current: 'all'", '<span>\u5168\u90e8</span>', "state.current !== 'all' && f.category !== state.current"].forEach(needle => {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing all-tab marker:', needle); process.exit(1) }
})
console.log('OK: "全部" tab present')

// 3. 拖拽排序（文件 + 分组）
;['setupFileDnD', 'setupGroupDnD', 'reorderList', 'saveFileOrder', 'saveGroupOrder',
  'draggable', 'data-gid', 'data-id'].forEach(needle => {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing DnD marker:', needle); process.exit(1) }
})
console.log('OK: drag-sort (files + groups) present')

// 4. 卡片备注行
if (code.indexOf('card-note') === -1) { console.error('FAIL: missing card-note'); process.exit(1) }
console.log('OK: card annotation line present')

// 5. 设置-共享文件夹
;['settingsModal', 'saveFolders', 'renderFolderList', 'folderStrip', 'LS_FOLDERS'].forEach(needle => {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing settings marker:', needle); process.exit(1) }
})
console.log('OK: folder settings present')

// 6. 软件/可执行分类
;["'软件'", "'exe','msi','msix'", "'deb','rpm','appimage'", "'apk','aab'", "'ipa'", "'dmg','pkg'"].forEach(needle => {
  if (code.indexOf(needle) === -1) { console.error('FAIL: missing app-category marker:', needle); process.exit(1) }
})
console.log('OK: executable/app category present')

console.log('PASS: all checks done')