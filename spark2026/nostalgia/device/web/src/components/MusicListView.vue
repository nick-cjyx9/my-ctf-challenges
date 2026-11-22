<template>
  <RetroListView
    title="音乐"
    icon="i-lucide-music"
    icon-class="text-blue-400"
    :meta="`${rows.length} 首 · ${playlistLabel}`"
    :rows="rows"
    :cursor="cursor"
    :window-start="windowStart"
    :per-page="PER_PAGE"
    :footer="footerHint"
    empty="还没有曲目，请导入播放列表"
    @pick="pick"
  />
</template>

<script setup lang="ts">
import RetroListView from './RetroListView.vue'
import { PER_PAGE, cursor, footerHint, nav, playlistLabel, rows, windowStart } from '../composables/useNav'

function pick(index: number) {
  cursor.value = index
  nav('ok')
}
</script>
