<template>
  <!-- BACK FACE — exactly 270 x 560, mirrored layout of the front -->
  <div class="relative w-[270px] h-[560px] select-none rounded-[28px] overflow-hidden">
    <!-- Brushed aluminium back cover -->
    <div
      class="w-full h-full p-[4px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),inset_0_-1px_3px_rgba(0,0,0,0.35)]"
      :style="{
        background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 25%, #ffffff 50%, #94a3b8 75%, #cbd5e1 100%)'
      }"
    >
      <div
        class="relative w-full h-full rounded-[24px] overflow-hidden"
        :style="{ background: 'radial-gradient(ellipse at 50% 35%, #f8fafc 0%, #cbd5e1 62%, #9aa7b6 100%)' }"
      >
        <!-- Brushed grain -->
        <div
          class="absolute inset-0 opacity-[0.13] pointer-events-none"
          style="background: repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.16) 1px, rgba(0,0,0,0.16) 2px);"
        ></div>

        <!-- Sheen matching the front panel -->
        <div
          class="absolute -top-[140px] -left-[100px] w-[500px] h-[360px] pointer-events-none mix-blend-overlay"
          :style="{
            opacity: sheenOpacity * 0.55,
            transform: `rotate(24deg) translateX(${sheenOffset}px)`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.12) 45%, transparent 100%)'
          }"
        ></div>

        <!-- PRINT BLOCK: vertically + horizontally centred as one group -->
        <div class="absolute inset-0 flex flex-col items-center justify-center" data-test="back-print">
          <!-- Speaker grille -->
          <div class="flex flex-col gap-[7px] items-center">
            <div class="flex gap-[7px]">
              <span v-for="n in 9" :key="`a${n}`" class="w-[6px] h-[6px] rounded-full bg-neutral-700/75 shadow-inner"></span>
            </div>
            <div class="flex gap-[7px]">
              <span v-for="n in 8" :key="`b${n}`" class="w-[6px] h-[6px] rounded-full bg-neutral-700/75 shadow-inner"></span>
            </div>
            <div class="flex gap-[7px]">
              <span v-for="n in 9" :key="`c${n}`" class="w-[6px] h-[6px] rounded-full bg-neutral-700/75 shadow-inner"></span>
            </div>
          </div>

          <!-- Engraved marks -->
          <div class="mt-[30px] flex flex-col items-center text-neutral-600" data-test="back-text">
            <div class="text-[13px] font-bold tracking-[0.22em] leading-none pl-[0.22em]">MP3 PLAYER</div>
            <div class="mt-[9px] text-[10px] font-mono tracking-wide leading-none">Input: 5V ⎓ 500mA</div>

            <div class="mt-[16px] flex items-center justify-center gap-3">
              <span class="text-[10px] font-bold border border-neutral-500 px-1 py-[1px] rounded-[2px] leading-none">CE</span>
              <span class="text-[10px] font-bold border border-neutral-500 px-1 py-[1px] rounded-[2px] leading-none">FC</span>
              <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z" />
              </svg>
            </div>

            <div class="mt-[26px] w-[68px] flex items-center justify-between text-neutral-500">
              <i class="i-lucide-headphones text-[13px]"></i>
              <i class="i-lucide-usb text-[13px]"></i>
            </div>
          </div>
        </div>

        <!-- TF silkscreen, aligned with the left-hand slot -->
        <div class="absolute right-[5px] top-[220px] text-[9px] font-bold tracking-[0.2em] text-neutral-500 rotate-90 origin-left" data-test="back-tf-label">
          TF
        </div>

        <!-- Volume key silhouettes, aligned with the right-hand buttons -->
        <div class="absolute left-[5px] top-[168px] flex flex-col gap-[16px]">
          <div class="w-[3px] h-[34px] bg-neutral-500/45 rounded-l-[2px]"></div>
          <div class="w-[3px] h-[34px] bg-neutral-500/45 rounded-l-[2px]"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  sheenOffset?: number
  sheenOpacity?: number
}>(), {
  sheenOffset: 0,
  sheenOpacity: 0.18,
})
</script>
