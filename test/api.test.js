import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

import { startTestServer, stopTestServer, resetForTest } from './helpers.js'

let base = null

test.before(async () => {
  const srv = await startTestServer()
  base = srv.base
})

test.after(async () => {
  await stopTestServer()
  resetForTest()
})

function req (method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(base + urlPath)
    const data = body ? Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)) : null
    const r = http.request(u, {
      method,
      headers: data ? {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      } : {}
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let json = null
        try { json = JSON.parse(text) } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, text, json })
      })
    })
    r.on('error', reject)
    if (data) r.write(data)
    r.end()
  })
}

function raw (method, urlPath, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(base + urlPath)
    const r = http.request(u, { method, headers }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
    })
    r.on('error', reject)
    r.end()
  })
}

/** 带二进制 body 的请求（上传用） */
function uploadRaw (urlPath, headers, bodyBuf) {
  return new Promise((resolve, reject) => {
    const u = new URL(base + urlPath)
    const r = http.request(u, {
      method: 'POST',
      headers: { ...headers, 'Content-Length': bodyBuf.length }
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let json = null
        try { json = JSON.parse(text) } catch (e) {}
        resolve({ status: res.statusCode, json, text })
      })
    })
    r.on('error', reject)
    r.write(bodyBuf)
    r.end()
  })
}

test('GET /api/health 返回索引数据', async () => {
  const { status, json } = await req('GET', '/api/health')
  assert.equal(status, 200)
  assert.equal(json.ok, true)
  assert.ok(json.files >= 4, '应索引到至少 4 个测试文件')
})

test('GET /api/files 返回文件列表与分类', async () => {
  const { status, json } = await req('GET', '/api/files')
  assert.equal(status, 200)
  assert.ok(Array.isArray(json.files))
  const cats = new Set(json.files.map(f => f.category))
  assert.ok(cats.has('image') && cats.has('document'), '应含测试文件的分类')
})

test('GET /api/files?q= 过滤搜索', async () => {
  const { json } = await req('GET', '/api/files?q=' + encodeURIComponent('海边'))
  assert.ok(json.files.length >= 1)
  assert.ok(json.files.every(f => f.name.includes('海边')))
})

test('备注：PATCH 写入 / 读取', async () => {
  const { json } = await req('GET', '/api/files')
  const file = json.files.find(f => f.category === 'image')
  assert.ok(file, '找到图片测试文件')

  const patch = await req('PATCH', '/api/meta/' + encodeURIComponent(file.id), { annotation: '这是我的测试备注' })
  assert.equal(patch.status, 200)

  const get = await req('GET', '/api/meta/' + encodeURIComponent(file.id))
  assert.equal(get.json.annotation, '这是我的测试备注')

  const list = await req('GET', '/api/files')
  const again = list.json.files.find(f => f.id === file.id)
  assert.equal(again.annotation, '这是我的测试备注', '文件列表应带备注')
})

test('留言板：POST 创建 / GET 列表 / DELETE 删除', async () => {
  const created = await req('POST', '/api/notes', { html: '<b>测试</b>', color: 'blue' })
  assert.equal(created.status, 201)
  const id = created.json.id

  const { json } = await req('GET', '/api/notes')
  const note = json.notes.find(n => n.id === id)
  assert.equal(note.html, '<b>测试</b>')
  assert.equal(note.color, 'blue')

  const del = await req('DELETE', '/api/notes/' + id)
  assert.equal(del.status, 200)
  const after = await req('GET', '/api/notes')
  assert.ok(!after.json.notes.find(n => n.id === id))
})

test('留言板：HTML 为空返回 400', async () => {
  const { status } = await req('POST', '/api/notes', { html: '', color: 'yellow' })
  assert.equal(status, 400)
})

test('分组：增改查删', async () => {
  const created = await req('POST', '/api/groups', { name: '测试分组', note: '说明' })
  assert.equal(created.status, 201)
  const gid = created.json.id

  const list = await req('GET', '/api/groups')
  const g = list.json.groups.find(x => x.id === gid)
  assert.equal(g.name, '测试分组')

  const patch = await req('PATCH', '/api/groups/' + gid, { name: '改名后', files: ['a', 'b'] })
  assert.equal(patch.status, 200)
  const list2 = await req('GET', '/api/groups')
  const g2 = list2.json.groups.find(x => x.id === gid)
  assert.equal(g2.name, '改名后')
  assert.deepEqual(g2.files, ['a', 'b'])

  const del = await req('DELETE', '/api/groups/' + gid)
  assert.equal(del.status, 200)
  const list3 = await req('GET', '/api/groups')
  assert.ok(!list3.json.groups.find(x => x.id === gid))
})

test('GET /files/ 返回文件并支持 Range', async () => {
  const { json } = await req('GET', '/api/files')
  const file = json.files.find(f => f.category === 'document' || f.category === 'image')
  const urlPath = '/files/' + encodeURIComponent(file.id)

  const full = await raw('GET', urlPath)
  assert.equal(full.status, 200)
  assert.equal(full.headers['accept-ranges'], 'bytes')
  assert.ok(Number(full.headers['content-length']) > 0)

  const range = await raw('GET', urlPath, { Range: 'bytes=0-9' })
  assert.equal(range.status, 206)
  assert.equal(range.body.length, 10)
  assert.match(range.headers['content-range'], /bytes 0-9\//)
})

test('静态文件：index.html 可访问', async () => {
  const { status, headers } = await raw('GET', '/')
  assert.equal(status, 200)
  assert.match(headers['content-type'], /text\/html/)
})

test('防目录穿越：非法 id 返回 404 不泄露文件', async () => {
  const { status } = await raw('GET', '/files/' + encodeURIComponent('shared/../../config.json'))
  assert.equal(status, 404)
})

test('文件从磁盘消失后，重扫清理旧备注记录', async () => {
  const { json } = await req('GET', '/api/files')
  const target = json.files.find(f => f.ext === 'pdf')
  assert.ok(target, '构造测试：找出 pdf 测试文件')

  // 写一条备注（先确保元数据行存在）
  const patch = await req('PATCH', '/api/meta/' + encodeURIComponent(target.id), { annotation: '待清理备注' })
  assert.equal(patch.status, 200)
  const before = await req('GET', '/api/meta/' + encodeURIComponent(target.id))
  assert.equal(before.json.annotation, '待清理备注')

  // 把文件从磁盘删掉，再触发重扫
  const fs = await import('node:fs')
  const path = await import('node:path')
  const { filesRoot } = await import('./helpers.js')
  const abs = path.join(filesRoot(), '报告.pdf')
  fs.rmSync(abs, { force: true })
  try {
    const refresh = await req('POST', '/api/refresh')
    assert.equal(refresh.status, 200)
    assert.equal(refresh.json.ok, true)

    const after = await req('GET', '/api/meta/' + encodeURIComponent(target.id))
    assert.equal(after.json.annotation, '', '磁盘文件消失后，旧备注应被清理')
    const list = await req('GET', '/api/files')
    assert.ok(!list.json.files.find(f => f.id === target.id), '重扫后文件列表不再包含已删除文件')
  } finally {
    // 恢复文件供其他测试使用（测试独立序，此处恢复无害）
    fs.writeFileSync(abs, 'fake-pdf-bytes')
    await req('POST', '/api/refresh')
  }
})

test('GET /api/dirs 返回共享根与子目录候选（绝对路径）', async () => {
  const path = await import('node:path')
  const { filesRoot } = await import('./helpers.js')
  const { status, json } = await req('GET', '/api/dirs')
  assert.equal(status, 200)
  assert.ok(Array.isArray(json.dirs))
  const values = json.dirs.map(d => d.value)
  assert.ok(values.includes(filesRoot()), '应包含共享根本身')
  assert.ok(values.includes(path.join(filesRoot(), 'photo')), '应包含子目录绝对路径')
  const photo = json.dirs.find(d => d.value === path.join(filesRoot(), 'photo'))
  assert.ok(photo.label.includes('photo'), 'label 应能看出目录层级')
  assert.ok(!values.some(v => v.includes('.hidden')), '不应暴露隐藏目录')
})

test('上传：指定目标子目录时文件落在该目录', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const { filesRoot } = await import('./helpers.js')
  const target = path.join(filesRoot(), 'photo')

  const up = await uploadRaw('/api/upload', {
    'X-File-Name': encodeURIComponent('新上传.txt'),
    'X-Upload-Dir': encodeURIComponent(target)
  }, Buffer.from('hello-upload'))

  assert.equal(up.status, 201)
  assert.ok(fs.existsSync(path.join(target, '新上传.txt')), '文件应落到指定子目录')

  const list = await req('GET', '/api/files')
  assert.ok(list.json.files.find(f => f.name === '新上传.txt'), '重扫后列表应包含新文件')
})

test('上传：目标目录不在共享范围内则拒绝', async () => {
  const os = await import('node:os')
  const up = await uploadRaw('/api/upload', {
    'X-File-Name': encodeURIComponent('evil.txt'),
    'X-Upload-Dir': encodeURIComponent(os.tmpdir())
  }, Buffer.from('x'))
  assert.equal(up.status, 400)
  assert.match(up.json.error, /共享/)
})

test('上传：不存在的目标子目录会被自动创建', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const { filesRoot } = await import('./helpers.js')
  const target = path.join(filesRoot(), 'photo', 'brand-new')

  const up = await uploadRaw('/api/upload', {
    'X-File-Name': encodeURIComponent('a.txt'),
    'X-Upload-Dir': encodeURIComponent(target)
  }, Buffer.from('a'))

  assert.equal(up.status, 201)
  assert.ok(fs.existsSync(path.join(target, 'a.txt')))
})

test('删除：从磁盘移除、列表消失、备注清理', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const { filesRoot } = await import('./helpers.js')
  const abs = path.join(filesRoot(), 'code.js')

  const list0 = await req('GET', '/api/files')
  const target = list0.json.files.find(f => f.name === 'code.js')
  assert.ok(target, '找到待删文件')

  await req('PATCH', '/api/meta/' + encodeURIComponent(target.id), { annotation: '删前备注' })

  const del = await req('DELETE', '/api/files/' + encodeURIComponent(target.id))
  assert.equal(del.status, 200)
  assert.equal(del.json.ok, true)
  assert.ok(!fs.existsSync(abs), '磁盘文件应被删除')

  const list1 = await req('GET', '/api/files')
  assert.ok(!list1.json.files.find(f => f.id === target.id), '列表不应再包含已删文件')

  const meta = await req('GET', '/api/meta/' + encodeURIComponent(target.id))
  assert.equal(meta.json.annotation, '', '对应备注应被清理')
})

test('删除：目标不存在返回 404', async () => {
  const del = await req('DELETE', '/api/files/' + encodeURIComponent('shared/not-there.txt'))
  assert.equal(del.status, 404)
})

test('删除：文件被删后自动从分组中摘除', async () => {
  const list0 = await req('GET', '/api/files')
  const target = list0.json.files.find(f => f.name === '软件安装.exe')
  assert.ok(target, '找到 exe 测试文件')

  const created = await req('POST', '/api/groups', { name: '删除联动' })
  const gid = created.json.id
  await req('PATCH', '/api/groups/' + gid, { files: [target.id] })

  const del = await req('DELETE', '/api/files/' + encodeURIComponent(target.id))
  assert.equal(del.status, 200)

  const groups = await req('GET', '/api/groups')
  const g = groups.json.groups.find(x => x.id === gid)
  assert.ok(!g.files.includes(target.id), '分组里不应再保留已删除文件的 id')
})

test('PUT /api/config 更新共享文件夹并重扫', async () => {
  const { status, json } = await req('PUT', '/api/config', {
    shareFolders: []
  })
  // 空数组被允许（不正确的共享根也只是被记录）
  assert.equal(status, 200)
  assert.equal(json.ok, true)
})