<script setup lang="ts">
import { ref, computed } from 'vue'
import { CATEGORIES, type Category } from '@/types/file'
import { mockFiles, getFilesByCategory } from '@/data/mock'
import CategoryTabs from '@/components/CategoryTabs.vue'
import FileGrid from '@/components/FileGrid.vue'
import AnnotationPanel from '@/components/AnnotationPanel.vue'

const activeCategory = ref<Category>('image')
const selectedFile = ref<InstanceType<typeof import('@/types/file').FileItem> | null>(null)

const categoryCounts = computed(() => {
  const counts: Record<Category, number> = {
    image: 0, video: 0, document: 0, code: 0, archive: 0, other: 0
  }
  for (const file of mockFiles) {
    counts[file.category]++
  }
  return counts
})

const currentFiles = computed(() => getFilesByCategory(activeCategory.value))

const handleFileClick = (file: InstanceType<typeof import('@/types/file').FileItem>) => {
  selectedFile.value = file
}

const handleFilePreview = (file: InstanceType<typeof import('@/types/file').FileItem>) => {
  alert(`预览: ${file.name}\n\n实际项目中会打开预览页面或新标签页`)
}

const handleAnnotationUpdate = (id: string, annotation: string) => {
  const file = mockFiles.find(f => f.id === id)
  if (file) {
    file.annotation = annotation
    if (selectedFile.value?.id === id) {
      selectedFile.value = { ...file }
    }
  }
}

const closeAnnotation = () => {
  selectedFile.value = null
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- 顶部导航栏 -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
          </svg>
          <div>
            <h1 class="text-xl font-bold text-slate-900">共享文件池</h1>
            <p class="text-xs text-slate-500">局域网可视化文件管理</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-slate-500 hidden sm:block">
            共 {{ mockFiles.length }} 个文件
          </span>
          <button class="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors" aria-label="设置">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button class="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors" aria-label="深色模式">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- 分类标签页 -->
    <CategoryTabs
      v-model:modelValue="activeCategory"
      :counts="categoryCounts"
    />

    <!-- 主内容区 -->
    <main class="flex-1 overflow-auto">
      <FileGrid
        :files="currentFiles"
        @file-click="handleFileClick"
        @file-preview="handleFilePreview"
      />
    </main>

    <!-- 备注侧边栏 -->
    <AnnotationPanel
      v-model:modelValue="selectedFile"
      @update:annotation="handleAnnotationUpdate"
      @close="closeAnnotation"
    />

    <!-- 底部状态栏（移动端） -->
    <footer class="bg-white border-t border-slate-200 px-4 py-2 sm:hidden">
      <div class="flex items-center justify-between text-xs text-slate-500">
        <span>{{ currentFiles.length }} 个文件</span>
        <span>长按文件查看操作</span>
      </div>
    </footer>
  </div>
</template>