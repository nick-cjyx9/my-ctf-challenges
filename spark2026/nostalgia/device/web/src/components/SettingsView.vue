<template>
  <RetroListView
    title="系统设置"
    icon="i-lucide-settings"
    icon-class="text-teal-400"
    meta="MP3-P111511"
    :rows="rows"
    :cursor="cursor"
    :window-start="windowStart"
    :per-page="PER_PAGE"
    :footer="footerHint"
    empty="没有可设置的项"
    @pick="pick"
  />
</template>

<script setup lang="ts">
import RetroListView from './RetroListView.vue'
import { PER_PAGE, cursor, footerHint, nav, rows, windowStart } from '../composables/useNav'

function pick(index: number) {
  cursor.value = index
  nav('ok')
}
</script>
