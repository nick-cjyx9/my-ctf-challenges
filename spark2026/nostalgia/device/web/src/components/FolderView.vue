<template>
  <div class="w-full h-full flex flex-col" data-test="view-folder">
    <RetroListView
      title="文件夹"
      icon="i-lucide-folder"
      icon-class="text-purple-400"
      :meta="`${rows.length} 项`"
      :rows="rows"
      :cursor="cursor"
      :window-start="windowStart"
      :per-page="PER_PAGE"
      :footer="footer"
      empty="TF 卡里没有文件"
      @pick="pick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RetroListView from './RetroListView.vue'
import { PER_PAGE, cursor, nav, rows, windowStart } from '../composables/useNav'
import { card, formatBytes, tfInserted } from '../composables/useDevice'

const footer = computed(() => {
  if (!tfInserted.value)
    return '卡已拔出 · 用左侧读卡器传入文件'
  return `可用 ${formatBytes(card.value.free)} / ${formatBytes(card.value.capacity)} · ≡ 拔出 TF 卡`
})

function pick(index: number) {
  cursor.value = index
  nav('ok')
}
</script>
