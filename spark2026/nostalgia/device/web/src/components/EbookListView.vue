<template>
  <RetroListView
    title="电子书"
    icon="i-lucide-book-open"
    icon-class="text-amber-400"
    :meta="`${ebookFiles.length} 本`"
    :rows="rows"
    :cursor="cursor"
    :window-start="windowStart"
    :per-page="PER_PAGE"
    :footer="footerHint"
    empty="TF 卡里没有电子书"
    @pick="pick"
  />
</template>

<script setup lang="ts">
import RetroListView from './RetroListView.vue'
import { PER_PAGE, cursor, footerHint, nav, rows, windowStart } from '../composables/useNav'
import { ebookFiles } from '../composables/useDevice'

function pick(index: number) {
  cursor.value = index
  nav('ok')
}
</script>
