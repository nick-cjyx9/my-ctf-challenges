<template>
  <!-- 文本预览 / 电子书阅读器 —— 照着真机电子书页：
       页码顶部居中 → 正文 → 底部蓝色阅读进度条 -->
  <div class="w-full h-full flex flex-col" data-test="view-reader">
    <div class="h-[14px] shrink-0 text-center text-[9px] font-mono text-neutral-500 leading-[14px]">
      {{ docPage }}/{{ docPages }}
    </div>

    <div class="flex-1 min-h-0 flex px-3">
      <div class="flex-1 min-w-0 overflow-hidden" :style="bodyStyle">
        <div
          v-for="(line, index) in visibleLines"
          :key="`${docLine}-${index}`"
          class="whitespace-pre text-neutral-100"
          :class="index === 0 && docLine % DOC_LINES !== 0 ? 'text-sky-300' : ''"
        >{{ line || ' ' }}</div>
      </div>

      <div class="w-[2px] shrink-0 my-1.5 ml-1.5 rounded-full bg-white/[0.07] relative overflow-hidden">
        <div class="absolute inset-x-0 rounded-full bg-white/30" :style="thumbStyle"></div>
      </div>
    </div>

    <div class="h-[2px] shrink-0 mx-3 rounded-full bg-white/[0.08] overflow-hidden">
      <div class="h-full rounded-full bg-sky-400 transition-all duration-150" :style="{ width: `${percent}%` }"></div>
    </div>

    <div class="h-[13px] shrink-0 px-3 flex items-center justify-between text-[8px] text-neutral-600">
      <span class="truncate pr-1">{{ doc?.name }}</span>
      <span class="shrink-0">⏮⏭ 翻页 · ▲▼ 滚动</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DOC_FONT, DOC_LINES, activeDoc as doc, docLine, docPage, docPages } from '../composables/useNav'

const bodyStyle = { font: DOC_FONT, lineHeight: '13px' }

const visibleLines = computed(() => {
  const lines = doc.value?.lines ?? []
  return lines.slice(docLine.value, docLine.value + DOC_LINES)
})

const percent = computed(() => {
  const total = doc.value?.lines.length ?? 0
  if (!total)
    return 100
  return Math.min(100, Math.round(((docLine.value + DOC_LINES) / total) * 100))
})

const thumbStyle = computed(() => {
  const total = Math.max(1, doc.value?.lines.length ?? 1)
  const height = Math.max(8, Math.round((DOC_LINES / total) * 100))
  const top = Math.min(100 - height, Math.round((docLine.value / total) * 100))
  return { height: `${height}%`, top: `${top}%` }
})
</script>
