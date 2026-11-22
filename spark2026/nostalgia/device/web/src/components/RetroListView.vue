<template>
  <!-- 复古列表：20px 标题 / 6 行 × 29px / 15px 底栏，正好填满 240×216。
       选中行用「细蓝竖条 + 提亮文字」表示，不用大色块。 -->
  <div class="w-full h-full flex flex-col" data-test="retro-list">
    <div class="h-[20px] shrink-0 flex items-center gap-2 px-3">
      <i :class="[icon, 'text-[11px]', iconClass]"></i>
      <span class="text-[10px] tracking-wide text-neutral-200 truncate">{{ title }}</span>
      <span class="ml-auto text-[9px] font-mono text-neutral-600 shrink-0 pl-1">{{ meta }}</span>
    </div>
    <div class="h-px shrink-0 bg-white/[0.07] mx-3"></div>

    <div class="flex-1 min-h-0 relative overflow-hidden pt-[1px]">
      <div
        v-if="!rows.length"
        class="h-full flex flex-col items-center justify-center gap-1.5 text-[9px] text-neutral-600"
      >
        <i class="i-lucide-package-open text-[18px] text-neutral-800"></i>
        <span>{{ empty }}</span>
      </div>

      <button
        v-for="(row, i) in visibleRows"
        :key="row.key"
        class="relative w-full h-[29px] px-3 flex items-center gap-2.5 text-left"
        @click="pick(i)"
      >
        <!-- 选中标记 -->
        <span
          class="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-r-full bg-sky-400 transition-all duration-150"
          :class="isCursor(i) ? 'h-[15px] opacity-100' : 'h-0 opacity-0'"
        ></span>

        <i
          :class="[row.icon || 'i-lucide-file', 'text-[12px] w-[13px] text-center', isCursor(i) ? 'text-white' : (row.iconClass || 'text-neutral-500'), row.dim ? 'opacity-50' : '']"
        ></i>

        <span class="min-w-0 flex-1">
          <span
            class="block truncate"
            :class="[
              isCursor(i) ? 'text-white' : (row.dim ? 'text-neutral-600' : 'text-neutral-400'),
              row.sub ? 'text-[10px] leading-[12px]' : 'text-[10px] leading-[27px]',
            ]"
          >{{ row.label }}</span>
          <span v-if="row.sub" class="block text-[8px] leading-[10px] text-neutral-600 truncate">{{ row.sub }}</span>
        </span>

        <span
          v-if="row.meta"
          class="text-[9px] font-mono shrink-0 pl-1"
          :class="isCursor(i) ? 'text-sky-300/90' : 'text-neutral-600'"
        >{{ row.meta }}</span>
      </button>
    </div>

    <div class="h-[15px] shrink-0 flex items-center justify-between px-3 text-[8px] text-neutral-500">
      <span class="truncate pr-1">{{ footerText }}</span>
      <span class="font-mono shrink-0">{{ pageText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ListRow } from '../types'

const props = withDefaults(defineProps<{
  title: string
  icon?: string
  iconClass?: string
  meta?: string
  rows: ListRow[]
  cursor?: number
  windowStart?: number
  perPage?: number
  footer?: string
  empty?: string
}>(), {
  icon: 'i-lucide-list',
  iconClass: 'text-sky-400',
  meta: '',
  cursor: 0,
  windowStart: 0,
  perPage: 6,
  footer: '',
  empty: '这里空空如也',
})

const emit = defineEmits<{ pick: [index: number] }>()

const visibleRows = computed(() => props.rows.slice(props.windowStart, props.windowStart + props.perPage))
const isCursor = (i: number) => props.windowStart + i === props.cursor
const pageText = computed(() => {
  const pages = Math.max(1, Math.ceil(props.rows.length / props.perPage))
  return `${Math.floor(props.cursor / props.perPage) + 1}/${pages} · ${props.rows.length}`
})
const footerText = computed(() => props.footer)

function pick(i: number) {
  emit('pick', props.windowStart + i)
}
</script>
