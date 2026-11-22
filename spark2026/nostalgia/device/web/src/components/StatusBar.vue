<template>
  <!-- 状态栏 240×22：左侧真实时间（12 小时制，跟系统时钟走），右侧横排分段电池 -->
  <div class="h-[22px] w-full shrink-0 flex items-center justify-between px-3 text-[9px] font-mono text-neutral-200">
    <span class="tracking-wide">{{ timeNow }}</span>

    <div class="flex items-center gap-2">
      <i v-if="isBluetoothOn" class="i-lucide-bluetooth text-[10px] text-sky-400"></i>
      <i v-if="isPlaying" class="i-lucide-play text-[9px] text-emerald-400"></i>
      <span
        class="text-[8px] tracking-[0.12em]"
        :class="tfInserted ? 'text-neutral-600' : 'text-amber-400'"
      >{{ tfInserted ? 'TF' : 'NO TF' }}</span>
    </div>

    <!-- 真机右上角：横排分段电池 -->
    <div class="flex items-center gap-[4px] pr-[2px]">
      <span class="text-[8px] text-neutral-500">{{ batteryLevel }}%</span>
      <div class="relative w-[22px] h-[11px] rounded-[2px] border border-neutral-300/70 p-[1.5px] flex items-stretch gap-[1px]">
        <span
          v-for="n in 4"
          :key="n"
          class="flex-1 rounded-[0.5px]"
          :class="n <= litBars ? 'bg-neutral-200' : 'bg-neutral-200/25'"
        ></span>
        <span class="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[4px] rounded-r-[1px] bg-neutral-300/70"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { isPlaying } from '../composables/useAudio'
import { tfInserted } from '../composables/useDevice'
import { batteryLevel, isBluetoothOn } from '../composables/useSettings'

/** 真机是 `10:00AM` 这种 12 小时制，显示的是当前真实时间 */
function stamp() {
  return new Date()
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s/g, '')
}

const timeNow = ref(stamp())
const litBars = computed(() => Math.max(1, Math.round((batteryLevel.value / 100) * 4)))

let timer: number | null = null

function tick() {
  timeNow.value = stamp()
}

onMounted(() => {
  // 每秒对一次表：分钟一跳到立刻跟上（值不变时 Vue 不会重渲染）
  timer = window.setInterval(tick, 1000)
  // 后台标签页里的定时器会被节流，回到前台时立刻校正
  document.addEventListener('visibilitychange', tick)
})

onUnmounted(() => {
  if (timer)
    window.clearInterval(timer)
  document.removeEventListener('visibilitychange', tick)
})
</script>
