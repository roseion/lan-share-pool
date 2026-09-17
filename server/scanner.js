import fs from 'node:fs'
import path from 'node:path'

/* 扩展名 → 分类（与 demo 保持一致，7 大类） */
export const EXT_CATEGORY = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'avif'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'webm', 'ts'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf', 'epub'],
  code: ['js', 'ts', 'vue', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'html', 'css', 'json',
    'xml', 'yaml', 'yml', 'sh', 'sql', 'php', 'rb'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'],
  app: [
    'exe', 'msi', 'msix', 'appx', 'bat', 'cmd', 'com', 'scr', 'ps1', 'dll', 'ocx', 'cpl',
    'deb', 'rpm', 'appimage', 'run', 'flatpak', 'flatpakref', 'snap', 'elf',
    'app', 'dmg', 'pkg',
    'apk', 'aab', 'xapk',
    'ipa',
    'jar', 'bin'
  ],
  other: []
}

let EXT_LOOKUP = null
function getExtLookup () {
  if (EXT_LOOKUP) return EXT_LOOKUP
  EXT_LOOKUP = {}
  for (const [cat, exts] of Object.entries(EXT_CATEGORY)) {
    for (const ext of exts) EXT_LOOKUP[ext.toLowerCase()] = cat
  }
  return EXT_LOOKUP
}

export function categorize (filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const lookup = getExtLookup()
  if (!ext) return 'other'
  return lookup[ext] || 'other'
}

/* 跳过隐藏文件/临时文件，避免把 NAS 垃圾文件索引进来 */
function shouldSkip (name, stat) {
  if (name.startsWith('.')) return true
  if (name === 'Thumbs.db' || name === 'desktop.ini' || name === '.DS_Store') return true
  if (name === '@eaDir' || name === '#recycle' || name === '$RECYCLE.BIN') return true
  return false
}

/**
 * 递归扫描单个共享根，返回扁平文件列表。
 * file:
 *   { id, name, relPath, shareRoot, category, size, ext, mtime }
 * id = shareRoot 名 + '/' + 相对路径，保证不同根目录文件不冲突。
 */
export async function scanRoot (shareRoot, shareLabel = null) {
  const results = []
  const label = shareLabel || path.basename(shareRoot) || 'root'

  async function walk (dir, relDir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      if (shouldSkip(entry.name, entry)) continue
      const abs = path.join(dir, entry.name)
      const rel = relDir ? path.join(relDir, entry.name) : entry.name
      if (entry.isDirectory()) {
        await walk(abs, rel)
      } else if (entry.isFile()) {
        const st = await fs.promises.stat(abs).catch(() => null)
        if (!st || !st.isFile()) continue
        const id = label + '/' + rel.split(path.sep).join('/')
        results.push({
          id,
          name: entry.name,
          relPath: rel.split(path.sep).join('/'),
          shareRoot: label,
          category: categorize(entry.name),
          size: st.size,
          ext: path.extname(entry.name).slice(1).toLowerCase(),
          mtime: Math.floor(st.mtimeMs)
        })
      }
    }
  }

  await walk(shareRoot, '')
  return results
}

/**
 * 递归收集单个共享根下的所有子目录（相对路径，'' 代表根目录本身）。
 * 与 scanRoot 用同一套跳过规则，保证「能扫到文件的目录」都可作为上传目标。
 */
export async function scanDirs (shareRoot) {
  const dirs = ['']

  async function walk (dir, relDir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (shouldSkip(entry.name, entry)) continue
      const rel = relDir ? relDir + '/' + entry.name : entry.name
      dirs.push(rel)
      await walk(path.join(dir, entry.name), rel)
    }
  }

  await walk(shareRoot, '')
  return dirs
}

/** 扫描多个共享根，合并结果；不存在的目录返回空数组并标注。 */
export async function scanAll (shareFolders) {
  const allImports = await Promise.all(
    shareFolders.map(async root => {
      const ok = fs.existsSync(root)
      if (!ok) return { root, ok: false, files: [], error: '目录不存在' }
      const st = await fs.promises.stat(root).catch(() => null)
      if (!st || !st.isDirectory()) return { root, ok: true, files: [], error: '不是目录' }
      const files = await scanRoot(root)
      return { root, ok: true, files, error: null }
    })
  )
  const files = []
  const folders = []
  for (const r of allImports) {
    if (r.ok && r.files.length) files.push(...r.files)
    folders.push({ path: r.root, ok: r.ok, count: r.files.length, error: r.error })
  }
  return { files, folders }
}