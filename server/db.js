import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { DB_PATH } from './config.js'

let db = null

export function openDb (dbPath = DB_PATH) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  db = new DatabaseSync(dbPath)
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS file_meta (
      id          TEXT PRIMARY KEY,      -- 相对共享池的路径（含共享根名）
      category    TEXT NOT NULL,
      annotation  TEXT NOT NULL DEFAULT '',
      updated_at  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      id       TEXT PRIMARY KEY,
      html     TEXT NOT NULL,
      color    TEXT NOT NULL DEFAULT 'yellow',
      created  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS groups (
      id       TEXT PRIMARY KEY,
      name     TEXT NOT NULL,
      note     TEXT NOT NULL DEFAULT '',
      files    TEXT NOT NULL DEFAULT '[]'  -- JSON 数组
    );
    CREATE INDEX IF NOT EXISTS idx_file_meta_category ON file_meta(category);
    CREATE INDEX IF NOT EXISTS idx_file_meta_updated ON file_meta(updated_at);
  `)
  return db
}

export function getDb () {
  if (!db) openDb()
  return db
}

/* ---------- 文件元数据（备注等） ---------- */
export function upsertFileMeta (id, category, updatedAt) {
  const stmt = getDb().prepare(`
    INSERT INTO file_meta (id, category, annotation, updated_at)
    VALUES (?, ?, '', ?)
    ON CONFLICT(id) DO UPDATE SET category = excluded.category, updated_at = excluded.updated_at
  `)
  stmt.run(id, category, updatedAt)
}

/** 删除磁盘上已不存在的旧索引/备注记录（保持 DB 与磁盘一致） */
export function pruneFileMeta (validIds) {
  const db = getDb()
  db.exec('BEGIN')
  try {
    if (!validIds || validIds.length === 0) {
      db.prepare('DELETE FROM file_meta').run()
    } else {
      const existing = db.prepare('SELECT id FROM file_meta').all().map(r => r.id)
      for (const id of existing) {
        if (!validIds.includes(id)) db.prepare('DELETE FROM file_meta WHERE id = ?').run(id)
      }
    }
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

export function getAnnotation (id) {
  const row = getDb().prepare('SELECT annotation FROM file_meta WHERE id = ?').get(id)
  return row ? row.annotation : ''
}

export function setAnnotation (id, annotation) {
  getDb().prepare(`
    INSERT INTO file_meta (id, category, annotation, updated_at)
    VALUES (?, 'other', ?, 0)
    ON CONFLICT(id) DO UPDATE SET annotation = excluded.annotation
  `).run(id, annotation)
}

/* ---------- 留言板 ---------- */
export function listNotes () {
  return getDb().prepare('SELECT id, html, color, created FROM notes ORDER BY created DESC').all()
}

export function insertNote (id, html, color) {
  getDb().prepare('INSERT INTO notes (id, html, color, created) VALUES (?, ?, ?, ?)').run(id, html, color, Date.now())
}

export function deleteNote (id) {
  return getDb().prepare('DELETE FROM notes WHERE id = ?').run(id)
}

export function updateNote (id, html, color) {
  getDb().prepare('UPDATE notes SET html = ?, color = ? WHERE id = ?').run(html, color, id)
}

/* ---------- 分组 ---------- */
export function listGroups () {
  return getDb().prepare('SELECT id, name, note, files FROM groups ORDER BY rowid').all()
}

export function insertGroup (id, name, note) {
  getDb().prepare('INSERT INTO groups (id, name, note, files) VALUES (?, ?, ?, ?)').run(id, name, note, '[]')
}

export function updateGroup (id, { name, note, files }) {
  getDb().prepare('UPDATE groups SET name = ?, note = ?, files = ? WHERE id = ?').run(name, note, JSON.stringify(files || []), id)
}

export function deleteGroup (id) {
  return getDb().prepare('DELETE FROM groups WHERE id = ?').run(id)
}

/** 文件被删除后，把它从所有分组的成员列表里摘掉，避免出现指向空文件的幽灵成员 */
export function removeIdFromGroups (fileId) {
  const rows = listGroups()
  let changed = 0
  for (const r of rows) {
    let files = []
    try { files = JSON.parse(r.files || '[]') } catch (e) { files = [] }
    if (!Array.isArray(files) || !files.includes(fileId)) continue
    const next = files.filter(x => x !== fileId)
    getDb().prepare('UPDATE groups SET files = ? WHERE id = ?').run(JSON.stringify(next), r.id)
    changed++
  }
  return changed
}

export function closeDb () {
  if (db) { db.close(); db = null }
}