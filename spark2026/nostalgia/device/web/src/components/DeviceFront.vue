<template>
  <!-- FRONT FACE — 270 × 560：亮银细边框 + 一整块黑色玻璃。
       屏幕与按键都在同一块玻璃上（屏幕无边框，与玻璃齐平）。 -->
  <div class="relative w-[270px] h-[560px] select-none rounded-[26px] overflow-hidden">
    <!-- 亮银边框 -->
    <div
      class="w-full h-full p-[4px]"
      :style="{ background: 'linear-gradient(155deg,#ffffff 0%,#e2e8f0 13%,#ffffff 32%,#a8b3c0 60%,#f4f7fa 84%,#c6d0da 100%)' }"
    >
      <div class="relative w-full h-full rounded-[22px] bg-black overflow-hidden">
        <div class="relative w-full h-full flex flex-col items-center py-[6px]">
          <!-- 屏幕：与玻璃齐平，没有内框 -->
          <div class="relative w-[240px] h-[240px] shrink-0 overflow-hidden" data-test="screen-frame">
            <!-- 关机 -->
            <div v-if="!isPoweredOn || !isScreenOn" class="w-full h-full bg-black flex items-center justify-center">
              <span class="text-neutral-800 font-mono text-[10px] tracking-[0.3em] uppercase">off</span>
            </div>

            <!-- 运行时界面：按 240×240 设计，再缩放填满屏幕 -->
            <ScreenCanvas v-else :design-w="240" :design-h="240">
              <div
                class="relative w-[240px] h-[240px] flex flex-col text-neutral-100 overflow-hidden bg-black"
                style="background-image: linear-gradient(180deg, #070b11 0%, #000 36%)"
              >
                <StatusBar />
                <VolumeBar />

                <div class="flex-1 min-h-0 relative overflow-hidden">
                  <Transition name="slide">
                    <HomeMenuView v-if="view === 'home'" key="home" />
                    <MusicListView v-else-if="view === 'music_list'" key="music_list" />
                    <MusicPlayerView v-else-if="view === 'music_player'" key="player" />
                    <EbookListView v-else-if="view === 'ebook_list'" key="ebook_list" />
                    <DocReaderView v-else-if="view === 'ebook_reader' || view === 'text_preview'" :key="view" />
                    <EbookStoreView v-else-if="view === 'ebook_store'" key="store" />
                    <ImportMenuView v-else-if="view === 'import_menu'" key="import_menu" />
                    <SettingsView v-else-if="view === 'settings'" key="settings" />
                    <UnderConstructionView v-else-if="view === 'stub'" key="stub" />
                    <FolderView v-else key="folder" />
                  </Transition>
                </div>

                <NoticeBar />
              </div>
            </ScreenCanvas>
          </div>

          <!-- 触控区：3 列 × 4 行格线 + 印在玻璃上的白色细线图标 -->
          <div class="flex-1 w-full relative select-none grid grid-cols-3 grid-rows-4 place-items-center">
            <div class="absolute inset-0 pointer-events-none">
              <div class="absolute inset-y-0 left-1/3 w-px bg-white/[0.04]"></div>
              <div class="absolute inset-y-0 left-2/3 w-px bg-white/[0.04]"></div>
              <div class="absolute inset-x-0 top-1/4 h-px bg-white/[0.04]"></div>
              <div class="absolute inset-x-0 top-2/4 h-px bg-white/[0.04]"></div>
              <div class="absolute inset-x-0 top-3/4 h-px bg-white/[0.04]"></div>
            </div>

            <button class="glass-key col-start-1 row-start-1" title="返回" @click.stop="press('return')">
              <svg class="key-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10a6 6 0 0 1 6 6v3" />
              </svg>
            </button>

            <button class="glass-key col-start-3 row-start-1" title="菜单 / 拔出 TF 卡" @click.stop="press('menu')">
              <svg class="key-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                <path d="M4.5 7.5h15" />
                <path d="M4.5 12h15" />
                <path d="M4.5 16.5h15" />
              </svg>
            </button>

            <button class="glass-key col-start-2 row-start-2" title="上" @click.stop="press('up')">
              <svg class="key-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
                <path d="M12 5.8 19.4 18H4.6z" />
              </svg>
            </button>

            <button class="glass-key col-start-1 row-start-3" title="上一页 / 上一曲" @click.stop="press('prev')">
              <svg class="key-svg" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="6.2" width="1.7" height="11.6" rx="0.85" />
                <path d="M20 6.9v10.2L12.9 12z" />
                <path d="M13.7 6.9v10.2L6.6 12z" />
              </svg>
            </button>

            <button class="glass-key col-start-2 row-start-3" title="确认 / 播放暂停" @click.stop="press('ok')">
              <svg class="key-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.8 5.6 13.4 12l-8.6 6.4z" />
                <rect x="15.6" y="5.6" width="1.7" height="12.8" rx="0.85" />
                <rect x="19.2" y="5.6" width="1.7" height="12.8" rx="0.85" />
              </svg>
            </button>

            <button class="glass-key col-start-3 row-start-3" title="下一页 / 下一曲" @click.stop="press('next')">
              <svg class="key-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6.9v10.2L11.1 12z" />
                <path d="M10.3 6.9v10.2L17.4 12z" />
                <rect x="18.3" y="6.2" width="1.7" height="11.6" rx="0.85" />
              </svg>
            </button>

            <button class="glass-key col-start-2 row-start-4" title="下" @click.stop="press('down')">
              <svg class="key-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
                <path d="M12 18.2 4.6 6h14.8z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- ===== 玻璃反光：斜向百叶窗 + 一道随旋转滑动的光泽 ===== -->
        <div
          class="absolute inset-0 pointer-events-none z-30"
          style="background: repeating-linear-gradient(112deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 33px)"
        ></div>
        <!-- 光泽铺满整块（左右都淡出），只横向位移，不会露出方形的硬边 -->
        <div
          class="absolute inset-y-0 -left-1/2 w-[200%] pointer-events-none z-30 mix-blend-screen"
          :style="{
            opacity: sheenOpacity,
            transform: `translateX(${sheenOffset}px)`,
            background: 'linear-gradient(104deg, transparent 32%, rgba(255,255,255,0.06) 41%, rgba(255,255,255,0.13) 49%, rgba(255,255,255,0.06) 57%, transparent 68%)',
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DocReaderView from './DocReaderView.vue'
import EbookListView from './EbookListView.vue'
import EbookStoreView from './EbookStoreView.vue'
import FolderView from './FolderView.vue'
import HomeMenuView from './HomeMenuView.vue'
import ImportMenuView from './ImportMenuView.vue'
import MusicListView from './MusicListView.vue'
import MusicPlayerView from './MusicPlayerView.vue'
import NoticeBar from './NoticeBar.vue'
import ScreenCanvas from './ScreenCanvas.vue'
import SettingsView from './SettingsView.vue'
import StatusBar from './StatusBar.vue'
import UnderConstructionView from './UnderConstructionView.vue'
import VolumeBar from './VolumeBar.vue'
import { isPoweredOn, isScreenOn } from '../composables/useAudio'
import { nav, view } from '../composables/useNav'

withDefaults(defineProps<{
  sheenOffset?: number
  sheenOpacity?: number
}>(), {
  sheenOffset: 0,
  sheenOpacity: 0.34,
})

function press(action: 'return' | 'up' | 'down' | 'menu' | 'prev' | 'next' | 'ok') {
  nav(action)
}
</script>

<style scoped>
/* 印在黑色玻璃上的按键：没有底衬，只有极淡的触摸反馈 */
.glass-key {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  color: rgba(244, 244, 245, 0.82);
  transition: background-color 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease, color 0.15s ease;
}

.glass-key:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.glass-key:active {
  transform: scale(0.9);
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 16px rgba(125, 211, 252, 0.3);
}

.key-svg {
  width: 26px;
  height: 26px;
}

.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.slide-leave-active {
  position: absolute;
  inset: 0;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
