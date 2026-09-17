<script setup lang="ts">
import type { FileItem } from '@/types/file'
import { formatSize, formatTime } from '@/types/file'

interface Props {
  file: FileItem
}

interface Emits {
  click: [file: FileItem]
  preview: [file: FileItem]
}

const emit = defineEmits<Emits>()

const handleClick = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('button')) return
  emit('click', props.file)
}

const handlePreview = (e: MouseEvent) => {
  e.stopPropagation()
  emit('preview', props.file)
}

const getFileIcon = (category: FileItem['category']) => {
  const icons: Record<FileItem['category'], string> = {
    image: '🖼️',
    video: '🎬',
    document: '📄',
    code: '💻',
    archive: '📦',
    other: '📎'
  }
  return icons[category] || '📎'
}

const isImage = props.file.category === 'image'
const isVideo = props.file.category === 'video'
</script>

<template>
  <article
    class="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
    tabindex="0"
    role="button"
    :aria-label="`${file.name}，${formatSize(file.size)}，${formatTime(file.modifiedAt)}`"
  >
    <!-- 缩略图区域 -->
    <div class="aspect-video relative bg-slate-50 overflow-hidden">
      <!-- 图片缩略图 -->
      <img
        v-if="isImage && file.thumbnail"
        :src="file.thumbnail"
        :alt="file.name"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <!-- 视频缩略图（模拟首帧） -->
      <div v-else-if="isVideo && file.thumbnail" class="w-full h-full relative">
        <img
          :src="file.thumbnail"
          :alt="file.name"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div class="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <svg class="w-12 h-12 text-white/90 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">视频</span>
      </div>
      <!-- 文档/代码/压缩包/其他 - 显示图标 -->
      <div v-else class="w-full h-full flex flex-col items-center justify-center p-4">
        <span class="text-6xl mb-2">{{ getFileIcon(file.category) }}</span>
        <span class="text-xs text-slate-500 uppercase tracking-wide">{{ file.category }}</span>
        <span v-if="file.category === 'document'" class="absolute bottom-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">文档</span>
        <span v-if="file.category === 'code'" class="absolute bottom-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">代码</span>
        <span v-if="file.category === 'archive'" class="absolute bottom-2 right-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded">压缩包</span>
        <span v-if="file.category === 'other'" class="absolute bottom-2 right-2 bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">其他</span>
      </div>

      <!-- 备注指示器 -->
      <div v-if="file.annotation" class="absolute top-2 right-2">
        <span class="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 110 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 11-4 0v-1a1 1 0 00-1-1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 110-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
          备注
        </span>
      </div>

      <!-- 悬停操作栏 -->
      <div class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
        <button
          @click="handlePreview"
          class="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md hover:bg-white text-slate-600 hover:text-blue-600 transition-colors"
          aria-label="预览"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          @click.stop="handleClick"
          class="p-2 bg-white/90 backdrop-blur rounded-lg shadow-md hover:bg-white text-slate-600 hover:text-blue-600 transition-colors"
          aria-label="下载"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 文件信息 -->
    <div class="p-3 min-h-[72px]">
      <h3 class="font-medium text-slate-900 truncate mb-1" title="{{ file.name }}">{{ file.name }}</h3>
      <div class="flex items-center justify-between text-xs text-slate-500">
        <span>{{ formatSize(file.size) }}</span>
        <span>{{ formatTime(file.modifiedAt) }}</span>
      </div>
    </div>
  </article>
</template>