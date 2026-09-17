import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
export const CONFIG_PATH = process.env.CONFIG_PATH || path.join(ROOT, 'config.json')
export const DATA_DIR = path.join(ROOT, 'data')
export const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'sidecar.db')

export const DEFAULT_CONFIG = () => ({
  port: parseInt(process.env.PORT || '8081', 10),
  shareFolders: [path.join(ROOT, 'shared')]
})

export function loadConfig () {
  let cfg = DEFAULT_CONFIG()
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed) {
      if (Number.isInteger(parsed.port)) cfg.port = parsed.port
    if (process.env.PORT) cfg.port = parseInt(process.env.PORT, 10)
      if (Array.isArray(parsed.shareFolders)) cfg.shareFolders = parsed.shareFolders.filter(s => typeof s === 'string' && s.trim())
    }
  } catch (e) {
    /* 首个默认配置：写盘 */
    saveConfig(cfg)
  }
  return cfg
}

export function saveConfig (cfg) {
  const safe = {
    port: cfg.port,
    shareFolders: (cfg.shareFolders || []).filter(s => typeof s === 'string' && s.trim())
  }
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(safe, null, 2), 'utf8')
  return safe
}