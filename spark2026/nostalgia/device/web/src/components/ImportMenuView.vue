<template>
  <RetroListView
    title="导入 XML 播放列表"
    icon="i-lucide-file-code"
    icon-class="text-emerald-400"
    :meta="`${rows.length} 个候选`"
    :rows="rows"
    :cursor="cursor"
    :window-start="windowStart"
    :per-page="PER_PAGE"
    :footer="footerHint"
    empty="卡内没有 .xml 播放列表"
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
