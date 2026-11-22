<template>
  <div ref="boxRef" class="relative w-full h-full overflow-hidden" data-test="screen-box">
    <div class="absolute top-1/2 left-1/2" :style="canvasStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  /** Logical design resolution the slotted UI is authored against. */
  designW?: number
  designH?: number
}>(), {
  designW: 240,
  designH: 240,
})

const boxRef = ref<HTMLElement | null>(null)
const scale = ref(1)
let observer: ResizeObserver | null = null

const canvasStyle = computed(() => ({
  width: `${props.designW}px`,
  height: `${props.designH}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
  transformOrigin: 'center center',
}))

function fit() {
  const el = boxRef.value
  if (!el)
    return
  const { clientWidth: w, clientHeight: h } = el
  if (!w || !h)
    return
  // Letterbox: never overflow, never stretch — the UI keeps its aspect ratio.
  scale.value = Math.min(w / props.designW, h / props.designH)
}

onMounted(() => {
  fit()
  if (boxRef.value) {
    observer = new ResizeObserver(fit)
    observer.observe(boxRef.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>
