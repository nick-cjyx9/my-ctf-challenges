<template>
  <!-- 电子书下载（建设中）：老固件的参数页样式 —— 等宽字体、点线标签、没有卡片 -->
  <div class="w-full h-full flex flex-col px-3 py-2 font-mono" data-test="view-ebook-store">
    <div class="flex items-center gap-2">
      <i class="i-lucide-cloud-download text-[11px] text-amber-400"></i>
      <span class="text-[10px] tracking-[0.14em] text-neutral-200">电子书下载</span>
      <span class="ml-auto text-[8px] tracking-[0.18em] text-amber-400/90">BUILDING…</span>
    </div>
    <div class="h-px bg-white/[0.12] mt-1.5 shrink-0"></div>

    <div class="mt-2 space-y-[3px] text-[9px] shrink-0">
      <div class="flex gap-2">
        <span class="w-[46px] shrink-0 text-neutral-600">SOURCE</span>
        <span class="flex-1 break-all text-sky-300/90 leading-[12px]">{{ cloud.endpoint }}</span>
      </div>
      <!-- 固件探活走的路径：它自己就说明了这是个 Spring Boot Actuator 服务 -->
      <div class="flex gap-2">
        <span class="w-[46px] shrink-0 text-neutral-600">HEALTH</span>
        <span class="flex-1 break-all text-neutral-400 leading-[12px]">
          {{ cloud.health_path ?? '/actuator/health' }}
          <span :class="stateClass">→ {{ stateText }}</span>
        </span>
      </div>
      <div class="flex gap-2">
        <span class="w-[46px] shrink-0 text-neutral-600">VERSION</span>
        <span class="text-neutral-400">{{ version }}</span>
      </div>
    </div>

    <div class="flex-1 min-h-0 mt-2 flex flex-col items-center justify-center gap-1.5">
      <span class="text-[10px] tracking-[0.2em] text-neutral-700">- - - - -</span>
      <span class="text-[9px] text-neutral-500">书库同步尚未完成</span>
      <span class="text-[9px] text-neutral-700">0 items</span>
    </div>

    <div class="text-center text-[8px] text-neutral-700 shrink-0">{{ footerHint }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cloud } from '../composables/useDevice'
import { footerHint } from '../composables/useNav'

const stateText = computed(() => {
  if (cloud.value.reachable === undefined)
    return 'UNKNOWN'
  return cloud.value.reachable ? (cloud.value.health ?? 'UP') : 'UNREACHABLE'
})

const stateClass = computed(() => (cloud.value.reachable
  ? 'text-emerald-400'
  : cloud.value.reachable === false ? 'text-red-400' : 'text-neutral-400'))

const version = computed(() => cloud.value.version ?? '0.0.1-SNAPSHOT')
</script>
