<template>
  <div class="p5-detail-card-root">
    <!-- Extra Skill Chip Header (追加技能 + Vortex Icon + 污秽吐息) -->
    <div class="skill-chip-header" v-if="product.extraSkill">
      <div class="skill-label-tab">
        <span>追加技能</span>
      </div>
      <div class="skill-pill-box">
        <div class="skill-icon-wrap">
          <svg viewBox="0 0 100 100" class="vortex-svg" aria-hidden="true">
            <path
              d="M 50 15 C 22 15 15 36 15 50 C 15 72 32 85 50 85 C 72 85 85 68 85 50 C 85 30 68 15 50 15 Z"
              fill="#000000"
            />
            <path
              d="M 28 50 C 28 35 40 26 52 26 C 66 26 73 36 73 50 C 73 64 62 74 50 74 C 38 74 33 66 33 56 C 33 46 40 40 48 40 C 56 40 59 45 59 50"
              stroke="#ffffff"
              stroke-width="8"
              stroke-linecap="round"
              fill="none"
            />
          </svg>
        </div>
        <span class="skill-title-txt">{{ product.extraSkill.name }}</span>
      </div>
    </div>

    <!-- Main Irregular White Card Body -->
    <div class="main-info-card">
      <div class="card-inner-content">
        <!-- 2 Lines description -->
        <div class="desc-text-group">
          <p v-for="(line, idx) in descLines" :key="idx" class="desc-line">
            {{ line }}
          </p>
        </div>

        <!-- Quantity in Possession (持有数量 0) -->
        <div class="owned-counter-slot">
          <span class="owned-label">持有数量</span>
          <span class="owned-digit">{{ product.owned }}</span>
        </div>

        <!-- 出售入口：持有且可回收时才出现，与 R 键同源 -->
        <div v-if="product.sellable && product.owned > 0" class="card-actions">
          <button class="sell-btn" @click="emit('sell')">
            <span class="sell-key">R</span>
            <span>出售</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '../api'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  (e: 'sell'): void
}>()

const descLines = computed(() => {
  return props.product.description.split('\n')
})
</script>

<style scoped lang="scss">
.p5-detail-card-root {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
  user-select: none;

  /* Skill Badge (追加技能) */
  .skill-chip-header {
    position: relative;
    z-index: 10;
    margin-bottom: -10px;
    margin-right: 32px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transform: rotate(-3deg) skew(-4deg);

    .skill-label-tab {
      background: #757575;
      color: #ffffff;
      font-size: 14px;
      font-weight: 900;
      font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
      padding: 3px 18px 4px 12px;
      clip-path: polygon(0 0, 100% 0, 92% 100%, 0 100%);
      letter-spacing: 1px;
      border: 2px solid #000000;
      border-bottom: none;
    }

    .skill-pill-box {
      background: #ffffff;
      color: #000000;
      padding: 5px 20px 5px 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      border: 3.5px solid #000000;
      box-shadow: 4px 4px 0 #000000;
      clip-path: polygon(0 0, 100% 0, 98% 100%, 1% 100%);

      .skill-icon-wrap {
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000000;
        border-radius: 4px;
        padding: 3px;

        .vortex-svg {
          width: 100%;
          height: 100%;
        }
      }

      .skill-title-txt {
        font-size: 24px;
        font-weight: 900;
        font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
        color: #000000;
        letter-spacing: 1px;
      }
    }
  }

  /* Main White Irregular Polygon Card */
  .main-info-card {
    position: relative;
    width: 480px;
    background: #ffffff;
    border: 5px solid #000000;
    box-shadow: 8px 10px 0px rgba(0, 0, 0, 0.95);
    transform: rotate(-2.5deg);
    /* Safe polygon that keeps all content visible and creates sharp P5 corners */
    clip-path: polygon(
      0% 4%, 
      100% 0%, 
      98% 97%, 
      18% 100%, 
      0% 95%
    );

    .card-inner-content {
      padding: 24px 28px 18px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }

    .desc-text-group {
      margin-top: 2px;

      .desc-line {
        font-size: 24px;
        font-weight: 900;
        font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
        color: #000000;
        line-height: 1.4;
        letter-spacing: 0.5px;
      }
    }

    .owned-counter-slot {
      display: flex;
      align-items: baseline;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
      padding-right: 10px;

      .owned-label {
        font-size: 28px;
        font-weight: 900;
        font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
        color: #000000;
        letter-spacing: 1px;
      }

      .owned-digit {
        font-size: 52px;
        font-weight: 900;
        font-family: var(--font-num), "Optima Nova", "Impact", "Arial Black", sans-serif;
        color: #000000;
        line-height: 0.9;
      }
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      pointer-events: auto;
      margin-top: -6px;

      .sell-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ff003c;
        color: #ffffff;
        border: 3px solid #000000;
        padding: 4px 16px 4px 7px;
        font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
        font-size: 19px;
        font-weight: 900;
        letter-spacing: 1px;
        cursor: pointer;
        box-shadow: 3px 3px 0 #000000;
        transform: rotate(-2deg);
        transition: transform 0.1s, background 0.1s;

        &:hover {
          background: #d40032;
          transform: rotate(-2deg) scale(1.05);
        }

        .sell-key {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          color: #000000;
          border: 1.5px solid #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Optima Nova", "Impact", sans-serif;
          font-size: 14px;
          font-weight: 900;
        }
      }
    }
  }
}
</style>
