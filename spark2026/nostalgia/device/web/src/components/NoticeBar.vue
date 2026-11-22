<template>
  <Transition name="notice">
    <div
      v-if="notice"
      class="absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] px-2.5 py-1 rounded-full
             bg-black/90 border border-white/[0.14] text-[8.5px] leading-[12px] text-neutral-200
             shadow-[0_8px_24px_-8px_rgba(0,0,0,0.95)] z-40 text-center"
      data-test="notice"
    >
      {{ notice }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { notice } from '../composables/useDevice'
</script>

<style scoped>
.notice-enter-active,
.notice-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translate(-50%, 6px);
}
</style>
