<template>
  <!-- 音量胶囊：黑色 + 细边 + 蓝色填充 -->
  <Transition name="fade">
    <div
      v-if="showVolumeOverlay"
      class="absolute top-[26px] left-1/2 -translate-x-1/2 w-[74%] bg-black/90 border border-white/[0.12]
             rounded-full px-3 py-1.5 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.9)] flex items-center gap-2 z-40"
      data-test="volume-overlay"
    >
      <i v-if="volume === 0" class="i-lucide-volume-x text-[11px] text-neutral-400 shrink-0"></i>
      <i v-else-if="volume < 50" class="i-lucide-volume-1 text-[11px] text-neutral-400 shrink-0"></i>
      <i v-else class="i-lucide-volume-2 text-[11px] text-neutral-400 shrink-0"></i>

      <div class="flex-1 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div class="h-full bg-sky-400 rounded-full transition-all duration-150" :style="{ width: `${volume}%` }"></div>
      </div>

      <span class="text-[9px] font-mono text-neutral-500 w-4 text-right shrink-0">{{ volume }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { showVolumeOverlay, volume } from '../composables/useAudio'
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -5px);
}
</style>
