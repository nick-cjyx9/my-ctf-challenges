<template>
  <!-- SIDE RAIL — 22 (thickness) x 504 (the straight run between the panel's
       r28 corner arcs). No border-radius: the texture ends exactly where the
       corner curve starts, so nothing is clipped or overhangs. -->
  <div class="relative w-[22px] h-[504px] select-none overflow-hidden">
    <div
      class="w-full h-full relative"
      :style="{
        background: 'linear-gradient(90deg, #64748b 0%, #dbe3ec 18%, #f8fafc 46%, #cbd5e1 64%, #94a3b8 84%, #475569 100%)'
      }"
    >
      <!-- Brushed grain along the length -->
      <div
        class="absolute inset-0 opacity-20 pointer-events-none"
        style="background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.16) 1px, rgba(0,0,0,0.16) 2px);"
      ></div>

      <!-- Seam where the glass rim meets the metal -->
      <div class="absolute inset-y-6 right-[5px] w-[1px] bg-black/25"></div>
      <div class="absolute inset-y-6 right-[4.5px] w-[1px] bg-white/35"></div>

      <!-- Soft falloff at the ends so the trimmed rail meets the corner curve
           without a hard bright edge -->
      <div class="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/25 to-transparent pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/25 to-transparent pointer-events-none"></div>

      <!-- ============ LEFT SIDE: TF card slot (≈11 mm ≈ 78 px) ============ -->
      <template v-if="side === 'left'">
        <div class="absolute left-0 right-0 top-[168px] flex flex-col items-center">
          <div
            @click.stop="toggleTF"
            class="relative w-[9px] h-[78px] rounded-[2px] cursor-pointer transition-all duration-200"
            style="background: linear-gradient(90deg, #0b0d10 0%, #1c1f24 45%, #0a0c0f 100%); box-shadow: inset 0 2px 4px rgba(0,0,0,0.9), inset 0 -2px 4px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.35);"
            :title="tfInserted ? 'TF 卡已插入（点击弹出）' : 'TF 卡槽为空（点击插入）'"
            data-test="tf-slot"
          >
            <div
              v-if="tfInserted"
              class="absolute inset-[2px] rounded-[1.5px] transition-all duration-300"
              style="background: linear-gradient(90deg, #b45309 0%, #f59e0b 48%, #92400e 100%); box-shadow: inset 0 1px 1px rgba(255,255,255,0.4);"
            >
              <div class="absolute inset-x-0 top-[9px] h-[1px] bg-black/35"></div>
              <div class="absolute inset-x-0 bottom-[13px] h-[1px] bg-black/35"></div>
            </div>
          </div>
          <span class="mt-1 text-[6px] tracking-[0.2em] text-neutral-500" style="writing-mode: vertical-rl;">TF</span>
        </div>
      </template>

      <!-- ============ RIGHT SIDE: physical volume rocker ============ -->
      <template v-else>
        <div class="absolute left-0 right-0 top-[140px] flex flex-col items-center">
          <!-- 一整条摇杆（真机是连在一起的药丸形） -->
          <div
            class="w-[16px] h-[78px] rounded-full overflow-hidden flex flex-col"
            style="background: linear-gradient(90deg, #7c8794 0%, #eef2f7 34%, #ffffff 54%, #aab4c0 100%); box-shadow: inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -1px 1px rgba(0,0,0,0.3), 1px 0 3px rgba(0,0,0,0.45);"
          >
            <button
              class="flex-1 flex items-center justify-center transition-colors active:bg-black/15"
              title="VOL +"
              @click.stop="adjustVolume(5)"
            >
              <span class="text-[9px] font-bold text-neutral-600 leading-none">+</span>
            </button>
            <div class="h-px w-full bg-black/25"></div>
            <button
              class="flex-1 flex items-center justify-center transition-colors active:bg-black/15"
              title="VOL -"
              @click.stop="adjustVolume(-5)"
            >
              <span class="text-[9px] font-bold text-neutral-600 leading-none">−</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { adjustVolume } from '../composables/useAudio'
import { tfInserted } from '../composables/useDevice'
import { ejectCard, insertCard } from '../composables/useNav'

defineProps<{
  side: 'left' | 'right'
}>()

function toggleTF() {
  if (tfInserted.value)
    void ejectCard()
  else
    void insertCard()
}
</script>
