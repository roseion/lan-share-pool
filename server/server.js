import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

import { loadConfig, saveConfig, DATA_DIR } from './config.js'
import { getDb, upsertFileMeta, pruneFileMeta, getAnnotation, setAnnotation,
  listNotes, insertNote, deleteNote, updateNote, listGroups, insertGroup, updateGroup, deleteGroup } from './db.js'
import { scanAll } from './scanner.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.join(__dirname, '..', 'public')

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mkv': 'video/x-matroska',
  '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.wav': 'audio/wav',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2'
}
const DEFAULT_MIME = 'application/octet-stream'

let cache = {
  files: [],
  folders: [],
  scannedAt: 0
}

async function refreshScan () {
  const cfg = loadConfig()
  const { files, folders } = await scanAll(cfg.shareFolders)
  const db = getDb()
  pruneFileMeta(files.map(f => f.id))
  for (const f of files) upsertFileMeta(f.id, f.category, f.mtime)
  cache = { files, folders, scannedAt: Date.now() }
  return cache
}

function sendJSON (res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) })
  res.end(body)
}

function readBody (req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', c => { size += c.length; if (size > 1e6) { reject(new Error('body too large')); req.destroy() } else chunks.push(c) })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/** 把 API 路径参数里的 %2F 等安全还原为真实相对路径 */
function decodeRel (s) {
  try { return decodeURIComponent(s) } catch (e) { return s }
}

/** 根据文件 id（shareRoot/相对路径）定位真实文件绝对路径 */
function resolveFile (id) {
  const f = cache.files.find(x => x.id === id)
  if (!f) return null
  const cfg = loadConfig()
  const shareRoot = cfg.shareFolders.find(r => (path.basename(r) || 'root') === f.shareRoot)
  if (!shareRoot) return null
  const abs = path.join(shareRoot, f.relPath)
  // 防目录穿越：保证解析后仍在共享根内
  const real = path.resolve(abs)
  const rootReal = path.resolve(shareRoot)
  if (!real.startsWith(rootReal)) return null
  return real
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const p = url.pathname
  const method = req.method

  try {
    /* ---------- API ---------- */
    if (p === '/api/health') {
      return sendJSON(res, 200, { ok: true, files: cache.files.length, folders: cache.folders, scannedAt: cache.scannedAt })
    }

    if (p === '/api/config' && method === 'GET') {
      return sendJSON(res, 200, loadConfig())
    }

    if (p === '/api/config' && method === 'PUT') {
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}')
      const cfg = loadConfig()
      if (Array.isArray(body.shareFolders)) cfg.shareFolders = body.shareFolders.map(s => String(s).trim()).filter(Boolean)
      if (Number.isInteger(body.port)) cfg.port = body.port
      saveConfig(cfg)
      await refreshScan()
      return sendJSON(res, 200, { ok: true, config: loadConfig(), folders: cache.folders })
    }

    if (p === '/api/files' && method === 'GET') {
      const q = url.searchParams.get('q') || ''
      let files = cache.files
      if (q) {
        const needle = q.toLowerCase()
        files = files.filter(f => f.name.toLowerCase().includes(needle) || f.relPath.toLowerCase().includes(needle))
      }
      const annotated = files.map(f => ({ ...f, annotation: getAnnotation(f.id) }))
      return sendJSON(res, 200, {
        files: annotated,
        folders: cache.folders,
        scannedAt: cache.scannedAt,
        total: cache.files.length
      })
    }

    if (p === '/api/refresh' && method === 'POST') {
      await refreshScan()
      return sendJSON(res, 200, { ok: true, folders: cache.folders })
    }

    /* 备注 */
    if (p.startsWith('/api/meta/') && method === 'PATCH') {
      const id = decodeRel(p.slice('/api/meta/'.length))
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}')
      setAnnotation(id, String(body.annotation || '').slice(0, 500))
      return sendJSON(res, 200, { ok: true })
    }
    if (p.startsWith('/api/meta/') && method === 'GET') {
      const id = decodeRel(p.slice('/api/meta/'.length))
      return sendJSON(res, 200, { id, annotation: getAnnotation(id) })
    }

    /* 留言板 */
    if (p === '/api/notes' && method === 'GET') return sendJSON(res, 200, { notes: listNotes() })
    if (p === '/api/notes' && method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}')
      const html = String(body.html || '').slice(0, 5000)
      if (!html) return sendJSON(res, 400, { error: '内容为空' })
      const color = ['yellow', 'pink', 'blue', 'green', 'orange'].includes(body.color) ? body.color : 'yellow'
      const id = crypto.randomUUID()
      insertNote(id, html, color)
      return sendJSON(res, 201, { ok: true, id })
    }
    if (p.startsWith('/api/notes/') && method === 'DELETE') {
      const id = decodeRel(p.slice('/api/notes/'.length))
      deleteNote(id)
      return sendJSON(res, 200, { ok: true })
    }
    if (p.startsWith('/api/notes/') && method === 'PATCH') {
      const id = decodeRel(p.slice('/api/notes/'.length))
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}')
      const row = listNotes().find(n => n.id === id)
      if (!row) return sendJSON(res, 404, { error: '便利贴不存在' })
      const html = body.html !== undefined ? String(body.html).slice(0, 5000) : row.html
      if (!html) return sendJSON(res, 400, { error: '内容为空' })
      const color = ['yellow', 'pink', 'blue', 'green', 'orange'].includes(body.color) ? body.color : row.color
      updateNote(id, html, color)
      return sendJSON(res, 200, { ok: true })
    }

    /* 分组 */
    if (p === '/api/groups' && method === 'GET') {
      const rows = listGroups().map(r => ({ ...r, files: JSON.parse(r.files || '[]') }))
      return sendJSON(res, 200, { groups: rows })
    }
    if (p === '/api/groups' && method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}')
      const name = String(body.name || '').trim().slice(0, 30)
      if (!name) return sendJSON(res, 400, { error: '名称不能为空' })
      const id = crypto.randomUUID()
      insertGroup(id, name, String(body.note || '').slice(0, 120))
      return sendJSON(res, 201, { ok: true, id })
    }
    if (p.startsWith('/api/groups/') && method === 'PATCH') {
      const id = decodeRel(p.slice('/api/groups/'.length))
      const body = JSON.parse((await readBody(req)).toString('utf8') || '{}')
      const row = listGroups().find(g => g.id === id)
      if (!row) return sendJSON(res, 404, { error: '分组不存在' })
      const files = Array.isArray(body.files) ? body.files.map(String) : JSON.parse(row.files || '[]')
      updateGroup(id, {
        name: body.name !== undefined ? String(body.name).trim().slice(0, 30) : row.name,
        note: body.note !== undefined ? String(body.note).slice(0, 120) : row.note,
        files
      })
      return sendJSON(res, 200, { ok: true })
    }
    if (p.startsWith('/api/groups/') && method === 'DELETE') {
      const id = decodeRel(p.slice('/api/groups/'.length))
      deleteGroup(id)
      return sendJSON(res, 200, { ok: true })
    }

    /* 上传：原始二进制，文件名在 X-File-Name */
    if (p === '/api/upload' && method === 'POST') {
      const cfg = loadConfig()
      const targetRoot = cfg.shareFolders.find(fs.existsSync)
      if (!targetRoot) return sendJSON(res, 400, { error: '没有可用共享文件夹' })
      const fileName = decodeURIComponent(req.headers['x-file-name'] || '')
      // 只允许可安全落盘的名称，防止路径注入
      const cleanName = path.basename(fileName).replace(/[<>:"|?*\\/]/g, '_').trim()
      if (!cleanName) return sendJSON(res, 400, { error: '文件名无效' })
      const dest = path.join(targetRoot, cleanName)
      const ws = fs.createWriteStream(dest)
      let wrote = 0
      await new Promise((resolve, reject) => {
        req.on('data', c => {
          // 限制单文件 2GB
          if (wrote + c.length > 2 * 1024 * 1024 * 1024) {
            ws.destroy()
            reject(new Error('文件过大'))
            return
          }
          wrote += c.length
        })
        req.pipe(ws)
        ws.on('finish', resolve)
        ws.on('error', reject)
        req.on('error', reject)
      })
      await refreshScan()
      return sendJSON(res, 201, { ok: true, name: cleanName, dest })
    }

    /* 文件直通：支持 Range（视频拖拽/断点） */
    if (p.startsWith('/files/')) {
      const id = decodeRel(p.slice('/files/'.length))
      const abs = resolveFile(id)
      if (!abs || !fs.existsSync(abs)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        return res.end('文件不存在')
      }
      const st = fs.statSync(abs)
      const ext = path.extname(abs).toLowerCase()
      const contentType = MIME[ext] || DEFAULT_MIME
      const download = url.searchParams.get('download') === '1'
      const fileName = url.searchParams.get('fn') || path.basename(abs)
      const disposition = download
        ? `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
        : 'inline'
      const range = req.headers.range
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range)
        if (m) {
          const start = m[1] ? parseInt(m[1], 10) : 0
          const end = m[2] ? parseInt(m[2], 10) : st.size - 1
          const chunkSize = end - start + 1
          res.writeHead(206, {
            'Content-Type': contentType,
            'Content-Range': `bytes ${start}-${end}/${st.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize
          })
          fs.createReadStream(abs, { start, end }).pipe(res)
          return
        }
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': st.size,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': disposition
      })
      fs.createReadStream(abs).pipe(res)
      return
    }

    /* 精确返回备注内容用文本直通 */
    if (p.startsWith('/raw/')) {
      const id = decodeRel(p.slice('/raw/'.length))
      const abs = resolveFile(id)
      if (!abs || !fs.existsSync(abs)) {
        res.writeHead(404); return res.end('not found')
      }
      const ext = path.extname(abs).toLowerCase()
      res.writeHead(200, {
        'Content-Type': MIME[ext] && MIME[ext].includes('text') ? MIME[ext] : 'text/plain; charset=utf-8',
        'Content-Length': fs.statSync(abs).size
      })
      fs.createReadStream(abs).pipe(res)
      return
    }

    /* ---------- 静态资源 ---------- */
    let filePath = path.join(PUBLIC_DIR, p === '/' ? 'index.html' : decodeURIComponent(p))
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403); return res.end('Forbidden')
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(PUBLIC_DIR, 'index.html')
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      return res.end('未找到页面')
    }
    const ext = path.extname(filePath).toLowerCase()
    const rs = fs.createReadStream(filePath)
    rs.on('error', function (e) {
      console.error('[static]', filePath, e.message)
      if (!res.headersSent) { res.writeHead(500); res.end('Server Error') } else res.destroy()
    })
    res.writeHead(200, { 'Content-Type': MIME[ext] || DEFAULT_MIME })
    rs.pipe(res)
  } catch (err) {
    console.error('[server]', err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: '服务器错误：' + err.message }))
    } else res.end()
  }
})

export async function start (port) {
  try {
    await refreshScan()
  } catch (e) {
    console.error('[server] 初始扫描失败：', e.message)
  }
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '0.0.0.0', () => {
      server.removeListener('error', reject)
      console.log(`[共享文件池] 已启动 → http://0.0.0.0:${port}`)
      console.log(`[共享文件池] 本地 → http://localhost:${port}`)
      console.log(`[共享文件池] 当前索引 ${cache.files.length} 个文件，共享根 ${cache.folders.length} 个`)
      resolve()
    })
  })
  return server
}

export function stop () {
  server.close()
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const cfg = loadConfig()
  start(cfg.port)
}