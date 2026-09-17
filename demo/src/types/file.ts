export type Category = 'image' | 'video' | 'document' | 'code' | 'archive' | 'other'

export interface FileItem {
  id: string
  name: string
  path: string
  category: Category
  size: number
  modifiedAt: number
  thumbnail?: string
  annotation: string
}

export interface CategoryConfig {
  key: Category
  label: string
  icon: string
  extensions: string[]
}

export const CATEGORIES: CategoryConfig[] = [
  { key: 'image', label: '图片', icon: '🖼️', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic'] },
  { key: 'video', label: '视频', icon: '🎬', extensions: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', 'webm'] },
  { key: 'document', label: '文档', icon: '📄', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf'] },
  { key: 'code', label: '代码', icon: '💻', extensions: ['js', 'ts', 'vue', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'sh', 'sql'] },
  { key: 'archive', label: '压缩包', icon: '📦', extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'] },
  { key: 'other', label: '其他', icon: '📎', extensions: [] }
]

export function getCategoryByExtension(ext: string): Category {
  const lowerExt = ext.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.extensions.includes(lowerExt)) {
      return cat.key
    }
  }
  return 'other'
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)} 天前`
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}