<script setup lang="ts">
import type { FileItem } from '@/types/file'

interface Props {
  modelValue: FileItem | null
}

interface Emits {
  'update:modelValue': [file: FileItem | null]
  'update:annotation': [id: string, annotation: string]
  close: []
}

const emit = defineEmits<Emits>()

const annotation = ref('')

watch(() => props.modelValue, (newFile) => {
  annotation.value = newFile?.annotation || ''
}, { immediate: true })

const saveAnnotation = () => {
  if (props.modelValue) {
    emit('update:annotation', props.modelValue.id, annotation.value)
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close')
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    saveAnnotation()
  }
}
</script>

<template>
  <Transition name="slide">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex" @click="emit('close')">
      <!-- 遮罩层 -->
      <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <!-- 侧边栏 -->
      <aside
        class="w-full max-w-md bg-white shadow-xl flex flex-col h-full animate-slide-in"
        @click.stop
        role="dialog"
        aria-modal="true"
        aria-labelledby="annotation-title"
      >
        <!-- 头部 -->
        <header class="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 id="annotation-title" class="text-lg font-semibold text-slate-900">文件备注</h2>
          <button
            @click="emit('close')"
            class="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="关闭"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- 文件信息 -->
        <div class="p-4 border-b border-slate-200 bg-slate-50">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-2xl">
              <span v-if="modelValue.category === 'image'">🖼️</span>
              <span v-else-if="modelValue.category === 'video'">🎬</span>
              <span v-else-if="modelValue.category === 'document'">📄</span>
              <span v-else-if="modelValue.category === 'code'">💻</span>
              <span v-else-if="modelValue.category === 'archive'">📦</span>
              <span v-else>📎</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900 truncate">{{ modelValue.name }}</p>
              <p class="text-sm text-slate-500">{{ modelValue.path }}</p>
            </div>
          </div>
        </div>

        <!-- 备注编辑区 -->
        <div class="flex-1 p-4 overflow-y-auto">
          <label for="annotation-input" class="block text-sm font-medium text-slate-700 mb-2">
            备注内容 <kbd class="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">⌘/Ctrl + Enter</kbd> 保存
          </label>
          <textarea
            id="annotation-input"
            v-model="annotation"
            @keydown="handleKeydown"
            class="w-full h-64 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400"
            placeholder="为这个文件添加备注...（例如：给客户看的最终版、待复盘、已确认可上线等）"
            rows="8"
            aria-describedby="annotation-hint"
          />
          <p id="annotation-hint" class="mt-2 text-xs text-slate-500">
            备注会自动保存到本地数据库，换设备访问也能看到
          </p>
        </div>

        <!-- 底部操作栏 -->
        <footer class="p-4 border-t border-slate-200 bg-white sticky bottom-0 flex gap-3">
          <button
            @click="emit('close')"
            class="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            关闭
          </button>
          <button
            @click="saveAnnotation"
            class="flex-1 px-4 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            保存备注
          </button>
        </footer>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.slide-enter-active {
  animation: slide-in 0.25s ease-out forwards;
}

.slide-leave-active {
  animation: slide-in 0.2s ease-in forwards reverse;
}
</style>