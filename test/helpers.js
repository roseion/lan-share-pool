import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import net from 'node:net'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SERVER_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'server', 'server.js')
let fixtureRoot = null
let child = null
let testPort = null

export function fixturePath () {
  return fixtureRoot || (fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lan-share-test-')))
}

export function filesRoot () {
  return path.join(fixturePath(), 'shared')
}

export async function initTestFixture () {
  const root = fixturePath()
  fs.rmSync(root, { recursive: true, force: true })
  fs.mkdirSync(path.join(root, 'shared', 'photo'), { recursive: true })
  fs.mkdirSync(path.join(root, 'shared', '.hidden'), { recursive: true })
  fs.mkdirSync(path.join(root, 'data'), { recursive: true })
  fs.writeFileSync(path.join(root, 'shared', 'photo', '海边.jpg'), 'fake-jpg-bytes')
  fs.writeFileSync(path.join(root, 'shared', '报告.pdf'), 'fake-pdf-bytes')
  fs.writeFileSync(path.join(root, 'shared', 'code.js'), 'const a=1;')
  fs.writeFileSync(path.join(root, 'shared', '软件安装.exe'), 'fake-exe')
  fs.writeFileSync(path.join(root, 'shared', '.hidden', 'secret.txt'), 'hidden')
  fs.writeFileSync(path.join(root, 'shared', 'Thumbs.db'), 'windows-cache')
  // 写 fixture 专用配置（端口先占位，startTestServer 会重写为实际端口）
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({
    port: 8081,
    shareFolders: [path.join(root, 'shared')]
  }, null, 2), 'utf8')
}

/** 同步阻塞 ms 毫秒（避免引入额外依赖；git-bash 环境可用） */
function sleepBlocking (ms) {
  try {
    const sab = new SharedArrayBuffer(4)
    const int32 = new Int32Array(sab)
    Atomics.wait(int32, 0, 0, ms)
  } catch (e) {
    // 极少数无 SharedArrayBuffer 的环境做个兜底
  }
}

/** 删除整个 fixture；Windows 上 SQLite 句柄释放有延迟，EBUSY 则重试 */
function rmFixtureSync (root) {
  let lastErr = null
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      fs.rmSync(root, { recursive: true, force: true })
      return
    } catch (e) {
      lastErr = e
      sleepBlocking(150)
    }
  }
  throw lastErr
}

export function resetForTest () {
  try { stopTestServer() } catch (e) {}
  if (fixtureRoot) {
    rmFixtureSync(fixtureRoot)
    fixtureRoot = null
  }
}

/** 找一个确定空闲的端口 */
function getFreePort () {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

/** 以子进程方式启动测试服务器，返回 { port, base } */
export async function startTestServer () {
  await initTestFixture()
  testPort = await getFreePort()
  const env = {
    ...process.env,
    DB_PATH: path.join(fixturePath(), 'data', 'test.db'),
    CONFIG_PATH: path.join(fixturePath(), 'config.json'),
    PORT: String(testPort)
  }
  child = spawn(process.execPath, [SERVER_PATH], { env, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', d => process.stdout.write('[test-server] ' + d))
  child.stderr.on('data', d => process.stderr.write('[test-server:err] ' + d))
  // 等 /api/health 就绪
  const base = 'http://127.0.0.1:' + testPort
  for (let i = 0; i < 50; i++) {
    if (child.exitCode !== null) throw new Error('测试服务器启动失败：' + (child.stderr.read() || ''))
    const ok = await ping(base).catch(() => false)
    if (ok) return { port: testPort, base }
    await sleep(100)
  }
  throw new Error('测试服务器 5 秒内未就绪')
}

export async function stopTestServer () {
  if (child && child.exitCode === null) {
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 2000)
      child.on('exit', () => { clearTimeout(timer); resolve() })
      child.kill()
    })
    child = null
  }
  testPort = null
}

function ping (base) {
  return new Promise((resolve) => {
    const r = http.get(base + '/api/health', res => {
      resolve(res.statusCode === 200)
      res.resume()
    })
    r.on('error', () => resolve(false))
    r.setTimeout(800, () => { r.destroy(); resolve(false) })
  })
}

function sleep (ms) { return new Promise(r => setTimeout(r, ms)) }