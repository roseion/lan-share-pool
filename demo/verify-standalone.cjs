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

// 数据完整性校验：31 个文件、6 类齐全
const ids = [...code.matchAll(/id: '(\d+)'/g)].length
const cats = [...code.matchAll(/category: '(\w+)'/g)].map(x => x[1])
const uniqueCats = [...new Set(cats)]
const counts = {}
cats.forEach(c => { counts[c] = (counts[c] || 0) + 1 })

if (ids !== 31) { console.error('FAIL: expected 31 files, got', ids); process.exit(1) }
console.log('OK: 31 mock files')

if (uniqueCats.sort().join(',') !== 'archive,code,document,image,other,video') {
  console.error('FAIL: categories mismatch ->', uniqueCats); process.exit(1)
}
console.log('OK: 6 categories:', JSON.stringify(counts))
console.log('PASS: all checks done')