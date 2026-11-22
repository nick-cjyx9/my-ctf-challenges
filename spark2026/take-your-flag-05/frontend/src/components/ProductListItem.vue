<template>
  <div class="product-item-row" :class="{ selected: selected }">
    <!-- Selected state full-width neon acid yellow bar with angled edge and drop shadow -->
    <div class="selection-bg" v-if="selected">
      <div class="yellow-bar"></div>
    </div>

    <div class="row-content">
      <!-- Authentic item icon rendered with pure vector SVG -->
      <div class="icon-slot">
        <!-- Mirror: Black/Red Box with Star and Mask Shape -->
        <svg v-if="product.iconType === 'mirror'" viewBox="0 0 80 36" class="item-svg">
          <rect x="0" y="0" width="80" height="36" fill="#000000" />
          <!-- Red stars and phantom mask -->
          <polygon points="18,18 24,11 30,18 24,25" fill="#ff0022" />
          <polygon points="48,18 54,11 60,18 54,25" fill="#ff0022" />
          <circle cx="20" cy="18" r="3" fill="#ff0022" />
          <circle cx="58" cy="18" r="3" fill="#ff0022" />
          <path d="M 22 18 Q 39 27 56 18" stroke="#ff0022" stroke-width="3" fill="none" />
        </svg>

        <!-- Nail / Magatama: Blue/Cyan Bottle Flask with Magatama Liquid Swirl -->
        <svg v-else viewBox="0 0 80 36" class="item-svg">
          <rect x="0" y="0" width="80" height="36" fill="#004466" />
          <!-- Cyan bottle silhouette -->
          <path
            d="M 6 10 L 22 10 L 22 6 L 30 6 L 30 10 L 70 10 L 74 18 L 70 30 L 6 30 Z"
            fill="#00c8f8"
          />
          <rect x="22" y="6" width="8" height="4" fill="#006699" />
          <!-- White Magatama / swirl inside -->
          <path
            d="M 26 21 C 26 15 34 12 42 12 C 50 12 55 16 55 21 C 55 26 49 28 42 28 C 35 28 30 25 30 22"
            fill="#ffffff"
          />
          <circle cx="46" cy="19" r="2.5" fill="#00c8f8" />
        </svg>
      </div>

      <!-- Item Name -->
      <div class="name-slot">
        <span class="product-name-text">{{ product.name }}</span>
      </div>

      <!-- Price Block -->
      <div class="price-slot">
        <span class="price-val">{{ product.price.toLocaleString() }}</span>
        <span class="price-currency">日元</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '../api'

defineProps<{
  product: Product
  selected: boolean
}>()
</script>

<style scoped lang="scss">
.product-item-row {
  position: relative;
  width: 100%;
  height: 52px;
  margin-bottom: 12px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;

  .selection-bg {
    position: absolute;
    inset: -3px -30px -3px -55px;
    z-index: 1;
    pointer-events: none;

    .yellow-bar {
      width: 100%;
      height: 100%;
      background: #dcff00; // Authentic Acid Neon Yellow
      clip-path: polygon(0% 0%, 97% 0%, 100% 100%, 0% 100%);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    }
  }

  .row-content {
    position: relative;
    z-index: 5;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 20px 0 0;
  }

  .icon-slot {
    width: 86px;
    height: 36px;
    margin-right: 22px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .item-svg {
      width: 100%;
      height: 100%;
      display: block;
      border-radius: 1px;
    }
  }

  .name-slot {
    flex: 1;
    display: flex;
    align-items: center;

    .product-name-text {
      font-size: 27px;
      font-weight: 900;
      font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
      color: #ffffff;
      letter-spacing: 1px;
      text-shadow: 2px 2px 0 #000;
    }
  }

  .price-slot {
    display: flex;
    align-items: baseline;
    gap: 6px;

    .price-val {
      font-size: 34px;
      font-weight: 900;
      font-family: var(--font-num), "Optima Nova", "Impact", "Arial Black", sans-serif;
      color: #ffffff;
      letter-spacing: 0.5px;
      text-shadow: 2px 2px 0 #000;
    }

    .price-currency {
      font-size: 17px;
      font-weight: 900;
      font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
      color: #ffffff;
      text-shadow: 1.5px 1.5px 0 #000;
    }
  }

  /* SELECTED STATE: Bold Black Text on Yellow Bar */
  &.selected {
    .row-content {
      .name-slot .product-name-text {
        color: #000000;
        text-shadow: none;
      }

      .price-slot .price-val {
        color: #000000;
        text-shadow: none;
      }

      .price-slot .price-currency {
        color: #000000;
        text-shadow: none;
      }
    }
  }
}
</style>
