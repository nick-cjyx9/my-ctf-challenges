<template>
  <!-- 主菜单：3×3 九宫格，彩色圆角大图标 + 白字标签直接压在黑屏上（真机样式） -->
  <div class="w-full h-full flex flex-col justify-center px-2 py-1.5" data-test="view-home">
    <div class="grid grid-cols-3 gap-x-1 gap-y-1">
      <button
        v-for="(item, idx) in HOME_MENU"
        :key="item.id"
        class="group flex flex-col items-center gap-[3px]"
        @click="pick(idx)"
        @mouseenter="homeCursor = idx"
      >
        <span
          class="relative w-[50px] h-[50px] rounded-[12px] bg-gradient-to-b flex items-center justify-center overflow-hidden transition-all duration-150"
          :class="[
            item.tile,
            homeCursor === idx
              ? 'scale-[1.06] shadow-[0_0_0_1.5px_rgba(255,255,255,0.9),0_6px_14px_rgba(0,0,0,0.7)]'
              : 'shadow-[0_3px_8px_rgba(0,0,0,0.55)] group-active:scale-95',
          ]"
        >
          <span class="absolute inset-x-0 top-0 h-1/2 bg-white/20"></span>
          <span class="absolute inset-0 rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"></span>
          <i
            :class="[
              item.icon,
              'relative text-[25px]',
              item.dark ? 'text-neutral-900/85' : 'text-white',
            ]"
          ></i>
        </span>

        <span
          class="text-[10px] leading-[11px] whitespace-nowrap transition-colors"
          :class="homeCursor === idx ? 'text-white' : 'text-neutral-300/90'"
          style="text-shadow: 0 1px 2px rgba(0,0,0,0.95)"
        >{{ item.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HOME_MENU, homeCursor, nav } from '../composables/useNav'

function pick(index: number) {
  homeCursor.value = index
  nav('ok')
}
</script>
