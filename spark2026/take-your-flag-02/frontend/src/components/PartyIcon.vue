<script setup lang="ts">
import '../assets/svgs/p5-icon-party.js'

defineProps<{
  name: 'alibaba'
}>()
</script>

<template>
  <svg class="party-icon" :aria-label="name" role="img">
    <use :href="`#${name}`" />
  </svg>
</template>

<style scoped>
.party-icon {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
