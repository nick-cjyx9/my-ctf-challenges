<script setup lang="ts">
defineProps<{
  src: string
  color: string
  alt: string
}>()
</script>

<template>
  <div class="avatar">
    <svg class="avatar-plates" viewBox="0 0 110 90" aria-hidden="true">
      <path fill="#000" d="M0 17 100.5 27.2 110 72.7 33.4 90Z" />
      <path fill="#fff" d="m16.4 20.5 80.3 9.9 9.7 39.6-68.6 10.4Z" />
      <path :fill="color" d="m22.5 28 71.9 3.4 9.9 36.1L40 76.6Z" />
    </svg>
    <img :src="src" :alt="alt">
  </div>
</template>

<style scoped>
.avatar {
  position: relative;
  width: 110px;
  height: 90px;
  flex: 0 0 110px;
  overflow: visible;
  transform-origin: center;
  animation: plate-in 300ms cubic-bezier(.18, .89, .32, 1.35) both;
}

.avatar-plates {
  position: absolute;
  inset: 0;
  width: 110px;
  height: 90px;
  overflow: visible;
}

img {
  position: absolute;
  z-index: 1;
  top: 4px;
  right: -2px;
  width: 80px;
  height: 80px;
  object-fit: contain;
  object-position: center bottom;
  clip-path: polygon(-35% -20%, 135% -20%, 135% 77%, 0 94%);
  transform-origin: 50% 115%;
  animation: portrait-in 150ms 160ms cubic-bezier(.18, .89, .32, 1.35) both;
}

@keyframes plate-in {
  from { transform: scale(.6); }
  to { transform: scale(1); }
}

@keyframes portrait-in {
  from { transform: scale(.8); }
  to { transform: scale(1); }
}
</style>
