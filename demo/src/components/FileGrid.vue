<script setup lang="ts">
import FileCard from './FileCard.vue'
import type { FileItem } from '@/types/file'

interface Props {
  files: FileItem[]
}

interface Emits {
  'file-click': [file: FileItem]
  'file-preview': [file: FileItem]
}
</script>

<template>
  <div v-if="files.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4 scrollbar-thin" role="list" aria-label="文件列表">
    <FileCard
      v-for="file in files"
      :key="file.id"
      :file="file"
      @click="$emit('file-click', file)"
      @preview="$emit('file-preview', file)"
    />
  </div>

  <div v-else class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <span class="text-3xl">📂</span>
    </div>
    <h3 class="text-lg font-medium text-slate-900 mb-1">暂无文件</h3>
    <p class="text-slate-500">该分类下还没有文件</p>
  </div>
</template>