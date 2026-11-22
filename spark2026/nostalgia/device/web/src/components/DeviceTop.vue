<template>
  <div class="relative w-[214px] h-[22px] select-none overflow-hidden">
    <div
      class="w-full h-full relative flex items-center"
      :style="{
        background: 'linear-gradient(180deg, #4b5563 0%, #94a3b8 14%, #e2e8f0 34%, #ffffff 48%, #cbd5e1 66%, #94a3b8 86%, #475569 100%)'
      }"
    >
      <!-- Brushed grain running along the length -->
      <div
        class="absolute inset-0 opacity-20 pointer-events-none"
        style="background: repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.2) 1px, rgba(0,0,0,0.2) 2px);"
      ></div>

      <!-- Chamfer highlight hugging the front edge (bottom of this face) -->
      <div class="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-t from-white/70 to-transparent pointer-events-none"></div>
      <!-- Rear edge shadow -->
      <div class="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-b from-black/40 to-transparent pointer-events-none"></div>

      <!-- End falloff so the trimmed rail meets the corner curve cleanly -->
      <div class="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
      <div class="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>

      <!-- Power slide switch -->
      <div class="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <span class="text-[6px] font-mono font-bold tracking-wider text-neutral-700/80 leading-none">OFF</span>

        <div
          @click.stop="togglePower"
          class="w-[30px] h-[9px] rounded-full cursor-pointer flex items-center p-[1.5px] transition-colors duration-200"
          style="background: #14171c; box-shadow: inset 0 1px 2px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.35);"
          :title="isPoweredOn ? '拨动关机' : '拨动开机'"
        >
          <div
            class="w-[6px] h-[6px] rounded-full transition-transform duration-200"
            :class="isPoweredOn ? 'translate-x-[21px] bg-emerald-400' : 'translate-x-0 bg-neutral-500'"
            style="box-shadow: 0 0 5px rgba(0,0,0,0.6);"
          ></div>
        </div>

        <span class="text-[6px] font-mono font-bold tracking-wider text-neutral-700/80 leading-none">ON</span>
      </div>

      <!-- 3.5mm earphone jack (top edge port) -->
      <div class="absolute left-[26px] top-1/2 -translate-y-1/2 z-10" title="3.5mm 耳机插孔">
        <div class="w-[11px] h-[11px] rounded-full bg-neutral-900 border border-neutral-600/70 shadow-inner flex items-center justify-center">
          <div class="w-[5px] h-[5px] rounded-full bg-black"></div>
        </div>
      </div>

      <!-- Charging / data port -->
      <div class="absolute right-[26px] top-1/2 -translate-y-1/2 z-10" title="USB 充电与数据传输口">
        <div class="w-[15px] h-[6px] rounded-[2px] bg-neutral-900 border border-neutral-600/70 shadow-inner flex items-center justify-center">
          <div class="w-[8px] h-[1.5px] bg-amber-500/80 rounded-xs"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isPoweredOn } from '../composables/useAudio'

function togglePower() {
  isPoweredOn.value = !isPoweredOn.value
}
</script>
