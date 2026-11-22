<template>
  <div class="p5-logo-container">
    <div class="logo-box-group">
      <!-- Kanji 1: 暗 (Enlarged and bold with sharp P5 white border) -->
      <div class="kanji-plate plate-an">
        <div class="plate-border"></div>
        <div class="plate-core">
          <span class="kanji-text">暗</span>
        </div>
      </div>

      <!-- Kanji 2: 站 (Enlarged and offset right-down) -->
      <div class="kanji-plate plate-zhan">
        <div class="plate-border"></div>
        <div class="plate-core">
          <span class="kanji-text">站</span>
        </div>
      </div>

      <!-- Yellow Ribbon: MAIL ORDER (Tilted over bottom of both plates) -->
      <div class="mail-order-ribbon">
        <span class="ribbon-text">MAIL ORDER</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.p5-logo-container {
  position: relative;
  display: inline-block;
  user-select: none;
  pointer-events: none;
  transform: rotate(-10deg) skew(-4deg);
  filter: drop-shadow(10px 14px 0px #000000);

  .logo-box-group {
    position: relative;
    display: flex;
    align-items: flex-start;
  }

  .kanji-plate {
    position: relative;
    width: 175px;
    height: 195px;
    display: flex;
    align-items: center;
    justify-content: center;

    .plate-border {
      position: absolute;
      inset: -8px;
      background: #ffffff;
      clip-path: polygon(2% 4%, 98% 0%, 96% 98%, 0% 94%);
      box-shadow: 4px 6px 0px rgba(0, 0, 0, 0.9);
    }

    .plate-core {
      position: absolute;
      inset: 0;
      background: #000000;
      clip-path: polygon(2% 4%, 98% 0%, 96% 98%, 0% 94%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kanji-text {
      position: relative;
      z-index: 5;
      font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
      font-size: 142px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1;
      display: block;
      margin-top: -6px;
      letter-spacing: -2px;
    }

    &.plate-an {
      transform: rotate(-2deg);
      z-index: 2;
    }

    &.plate-zhan {
      transform: rotate(5deg) translate(-18px, 22px);
      z-index: 3;
    }
  }

  .mail-order-ribbon {
    position: absolute;
    bottom: -22px;
    left: 95px;
    z-index: 10;
    background: #dcff00; // Acid Yellow
    color: #000000;
    padding: 3px 22px 5px 22px;
    border: 4.5px solid #000000;
    box-shadow: 5px 7px 0px #000000;
    transform: rotate(6deg);
    clip-path: polygon(0% 0%, 100% 3%, 97% 100%, 0% 95%);

    .ribbon-text {
      font-family: var(--font-num), "Optima Nova", "Impact", "Arial Black", sans-serif;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 2.5px;
      line-height: 1.1;
      white-space: nowrap;
      display: block;
    }
  }
}
</style>
