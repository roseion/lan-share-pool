<script setup lang="ts">
import { CATEGORIES, type Category } from '@/types/file'

interface Props {
  modelValue: Category
  counts: Record<Category, number>
}

const emit = defineEmits<{
  'update:modelValue': [value: Category]
}>()

const handleClick = (category: Category) => {
  emit('update:modelValue', category)
}
</script>

<template>
  <div class="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 shadow-sm">
    <div class="max-w-7xl mx-auto">
      <nav class="flex gap-1 overflow-x-auto scrollbar-thin pb-1" role="tablist" aria-label="文件分类">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          @click="handleClick(cat.key)"
          :class="[
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            modelValue === cat.key
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          ]"
          :aria-selected="modelValue === cat.key"
          role="tab"
        >
          <span class="flex items-center gap-2">
            <span class="text-lg">{{ cat.icon }}</span>
            <span>{{ cat.label }}</span>
            <span
              class="px-2 py-0.5 text-xs font-semibold rounded-full"
              :class="modelValue === cat.key ? 'bg-blue-400 text-blue-900' : 'bg-slate-100 text-slate-600'"
            >
              {{ counts[cat.key] || 0 }}
            </span>
          </span>
        </button>
      </nav>
    </div>
  </div>
</template>