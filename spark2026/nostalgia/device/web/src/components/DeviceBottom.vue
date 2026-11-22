<template>
  <!-- BOTTOM RAIL — 214 (straight run between the r28 corner arcs) x 22.
       Local +Y maps to device BACK, so the TOP edge is the front chamfer. -->
  <div class="relative w-[214px] h-[22px] select-none overflow-hidden">
    <div
      class="w-full h-full relative flex items-center"
      :style="{
        background: 'linear-gradient(0deg, #4b5563 0%, #94a3b8 14%, #e2e8f0 34%, #ffffff 48%, #cbd5e1 66%, #94a3b8 86%, #475569 100%)'
      }"
    >
      <!-- Brushed grain running along the length -->
      <div
        class="absolute inset-0 opacity-20 pointer-events-none"
        style="background: repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.2) 1px, rgba(0,0,0,0.2) 2px);"
      ></div>

      <!-- Chamfer highlight hugging the front edge (top of this face) -->
      <div class="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-b from-white/70 to-transparent pointer-events-none"></div>
      <!-- Rear edge shadow -->
      <div class="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>

      <!-- End falloff so the trimmed rail meets the corner curve cleanly -->
      <div class="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
      <div class="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>

      <!-- Reset pinhole -->
      <div class="absolute left-[30px] top-1/2 -translate-y-1/2 z-10" title="RESET 复位孔">
        <div class="w-[5px] h-[5px] rounded-full bg-black/85 shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]"></div>
      </div>

      <!-- Microphone aperture -->
      <div class="absolute left-[58px] top-1/2 -translate-y-1/2 z-10" title="麦克风收音孔">
        <div class="w-[4px] h-[4px] rounded-full bg-black/70"></div>
      </div>

      <!-- Model silkscreen, centered on the bottom rail -->
      <div class="absolute left-1/2 -translate-x-1/2 z-10 text-[6px] font-mono tracking-[0.15em] text-neutral-700/75 leading-none">
        MADE IN CHINA
      </div>

      <!-- Lanyard loop recess -->
      <div class="absolute right-[28px] top-1/2 -translate-y-1/2 z-10" title="挂绳孔">
        <div class="w-[13px] h-[7px] rounded-full bg-neutral-800 border border-neutral-600/60 shadow-inner flex items-center justify-center">
          <div class="w-[7px] h-[3px] rounded-full bg-black/80"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
