<template>
  <div class="p5-particles" aria-hidden="true">
    <div
      v-for="star in stars"
      :key="star.id"
      class="star"
      :style="{
        left: star.left + '%',
        top: star.top + '%',
        width: star.size + 'px',
        height: star.size + 'px',
        animationDelay: star.delay + 's',
        animationDuration: star.duration + 's',
        transform: `rotate(${star.rotation}deg)`
      }"
    >
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Star {
  id: number
  left: number
  top: number
  size: number
  delay: number
  duration: number
  rotation: number
}

const stars = ref<Star[]>([])

onMounted(() => {
  const list: Star[] = []
  for (let i = 0; i < 28; i++) {
    list.push({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.floor(Math.random() * 14) + 8,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
      rotation: Math.random() * 360
    })
  }
  stars.value = list
})
</script>

<style scoped lang="scss">
.p5-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;

  .star {
    position: absolute;
    color: rgba(255, 255, 255, 0.18);
    animation: starFloat ease-in-out infinite alternate;

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
}

@keyframes starFloat {
  0% {
    transform: translateY(0px) rotate(0deg) scale(0.8);
    opacity: 0.1;
  }
  50% {
    opacity: 0.4;
    color: rgba(220, 255, 0, 0.4);
  }
  100% {
    transform: translateY(-20px) rotate(45deg) scale(1.1);
    opacity: 0.2;
  }
}
</style>
