import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { resetForTest, initTestFixture, filesRoot } from './helpers.js'

test.beforeEach(async () => {
  await initTestFixture()
})

test.afterEach(() => resetForTest())

test('分类器：各种扩展名正确归类', async () => {
  const { categorize } = await import('../server/scanner.js')
  const cases = [
    ['a.jpg', 'image'], ['b.MP4', 'video'], ['c.pdf', 'document'],
    ['d.ts', 'code'], ['e.zip', 'archive'], ['f.exe', 'app'],
    ['g.apk', 'app'], ['h.dmg', 'app'], ['i.ipa', 'app'],
    ['no-ext', 'other'], ['x.xyz', 'other']
  ]
  for (const [name, cat] of cases) {
    assert.equal(categorize(name), cat, `${name} 应为 ${cat}`)
  }
})

test('扫描：目录树扁平化 + 跳过隐藏文件', async () => {
  const { scanRoot } = await import('../server/scanner.js')
  const files = await scanRoot(filesRoot())
  const names = files.map(f => f.relPath).sort()
  assert.ok(names.includes('photo/海边.jpg'), '应包含子目录文件')
  assert.ok(names.includes('报告.pdf'), '应包含根目录文件')
  assert.ok(!names.some(n => n.includes('.hidden')), '应跳过隐藏文件')
  assert.ok(!names.some(n => n.includes('Thumbs.db')), '应跳过 Thumbs.db')
})

test('扫描：分类与 id 规范', async () => {
  const { scanRoot } = await import('../server/scanner.js')
  const files = await scanRoot(filesRoot(), 'shared')
  const photo = files.find(f => f.relPath === 'photo/海边.jpg')
  assert.ok(photo, '找到照片')
  assert.equal(photo.category, 'image')
  assert.equal(photo.id, 'shared/photo/海边.jpg')
  assert.ok(photo.size > 0 && Number.isInteger(photo.size))
  assert.ok(Number.isInteger(photo.mtime))
})

test('扫描：不存在的目录返回空且标注错误', async () => {
  const { scanAll } = await import('../server/scanner.js')
  const { files, folders } = await scanAll([path.join(os.tmpdir(), 'nope-' + Date.now())])
  assert.equal(files.length, 0)
  assert.equal(folders[0].ok, false)
})

test('目录树：scanDirs 返回根与所有子目录，跳过隐藏目录', async () => {
  const { scanDirs } = await import('../server/scanner.js')
  fs.mkdirSync(path.join(filesRoot(), 'photo', 'sub'), { recursive: true })
  const dirs = await scanDirs(filesRoot())
  assert.equal(dirs[0], '', '第一项应是根目录本身')
  assert.ok(dirs.includes('photo'), '应包含子目录 photo')
  assert.ok(dirs.includes('photo/sub'), '应包含嵌套子目录 photo/sub')
  assert.ok(!dirs.some(d => d.includes('.hidden')), '应跳过隐藏目录')
})