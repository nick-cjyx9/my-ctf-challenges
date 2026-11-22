<template>
  <div class="p5-icon-badge" :class="[type, { active: active }]">
    <!-- Magatama / 勾玉 -->
    <svg v-if="type.startsWith('magatama')" viewBox="0 0 100 100" class="icon-svg magatama-svg">
      <path
        d="M 50 15 C 32 15 18 29 18 47 C 18 64 30 76 44 83 C 58 90 75 88 82 76 C 89 64 86 48 76 38 C 66 28 58 36 50 36 C 42 36 36 30 36 22 C 36 17 42 15 50 15 Z"
        fill="currentColor"
      />
      <circle cx="38" cy="48" r="6" fill="#000" />
      <path
        d="M 68 34 C 74 44 72 58 64 66"
        stroke="#fff"
        stroke-width="4"
        stroke-linecap="round"
        fill="none"
      />
    </svg>

    <!-- Mirror / 灵异手镜 (Mask / star motif) -->
    <svg v-else-if="type === 'mirror'" viewBox="0 0 100 100" class="icon-svg mirror-svg">
      <rect x="25" y="10" width="50" height="50" rx="8" fill="currentColor" />
      <circle cx="50" cy="35" r="18" fill="#111" stroke="#fff" stroke-width="3" />
      <!-- Joker mask star inside mirror -->
      <path
        d="M 50 24 L 53 31 L 60 32 L 55 37 L 57 44 L 50 40 L 43 44 L 45 37 L 40 32 L 47 31 Z"
        fill="#ff003c"
      />
      <!-- Handle -->
      <path d="M 45 60 L 42 90 L 58 90 L 55 60 Z" fill="currentColor" stroke="#fff" stroke-width="2" />
      <circle cx="50" cy="84" r="3" fill="#ff003c" />
    </svg>

    <!-- Nail / 五寸钉 (Spike) -->
    <svg v-else-if="type === 'nail'" viewBox="0 0 100 100" class="icon-svg nail-svg">
      <!-- Nail Head -->
      <rect x="20" y="15" width="60" height="12" rx="2" fill="currentColor" stroke="#fff" stroke-width="2" />
      <!-- Shaft tapering to sharp tip -->
      <path d="M 44 27 L 44 75 L 50 92 L 56 75 L 56 27 Z" fill="currentColor" stroke="#fff" stroke-width="2" />
      <!-- Curse lines -->
      <line x1="32" y1="42" x2="68" y2="42" stroke="#ff003c" stroke-width="3" />
      <line x1="36" y1="56" x2="64" y2="56" stroke="#ff003c" stroke-width="3" />
    </svg>

    <!-- Armor / 防具 -->
    <svg v-else-if="type === 'armor'" viewBox="0 0 100 100" class="icon-svg armor-svg">
      <path
        d="M 25 20 L 50 10 L 75 20 L 78 52 C 78 72 50 90 50 90 C 50 90 22 72 22 52 Z"
        fill="currentColor"
        stroke="#fff"
        stroke-width="3"
      />
      <circle cx="50" cy="45" r="14" fill="#000" />
      <path d="M 50 36 L 50 54 M 41 45 L 59 45" stroke="#f9d142" stroke-width="4" stroke-linecap="round" />
    </svg>

    <!-- Skill Card / 技能卡 -->
    <svg v-else-if="type === 'skill-card'" viewBox="0 0 100 100" class="icon-svg skill-svg">
      <rect x="24" y="16" width="52" height="68" rx="4" transform="rotate(-6 50 50)" fill="currentColor" stroke="#fff" stroke-width="3" />
      <circle cx="50" cy="50" r="15" fill="#000" />
      <path d="M 42 50 L 58 50 M 50 42 L 50 58" stroke="#1cfeff" stroke-width="4" stroke-linecap="round" />
    </svg>

    <!-- Accessory / 贵重品 / 会员卡 -->
    <svg v-else-if="type === 'accessory'" viewBox="0 0 100 100" class="icon-svg acc-svg">
      <rect x="15" y="25" width="70" height="50" rx="6" fill="currentColor" stroke="#fff" stroke-width="3" />
      <rect x="22" y="38" width="18" height="14" rx="2" fill="#ffd700" />
      <line x1="15" y1="62" x2="85" y2="62" stroke="#000" stroke-width="6" />
      <circle cx="72" cy="45" r="6" fill="#fff" />
    </svg>

    <!-- General Item / 黑石 / 物品 -->
    <svg v-else viewBox="0 0 100 100" class="icon-svg item-svg">
      <polygon points="50,15 82,32 82,68 50,85 18,68 18,32" fill="currentColor" stroke="#fff" stroke-width="3" />
      <polygon points="50,28 70,40 70,60 50,72 30,60 30,40" fill="#000" />
      <circle cx="50" cy="50" r="6" fill="#fff" />
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  type: string
  active?: boolean
}>()
</script>

<style scoped lang="scss">
.p5-icon-badge {
  position: relative;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border: 2px solid #000;
  border-radius: 4px;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
  flex-shrink: 0;

  .icon-svg {
    width: 28px;
    height: 28px;
    display: block;
  }

  &.active {
    background: #000;
    box-shadow: 2px 2px 0 #000;
  }
}
</style>
