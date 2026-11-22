<template>
  <!-- 正在播放 240×216：封面 / 曲目 / 细进度条 / 与机身同款的线稿按键 -->
  <div class="w-full h-full flex flex-col items-center justify-between pt-1 pb-2" data-test="view-music">
    <div class="flex flex-col items-center">
      <div class="relative w-[76px] h-[76px] rounded-[18px] bg-gradient-to-b from-sky-400 to-blue-600 overflow-hidden
                  shadow-[0_8px_20px_-6px_rgba(37,99,235,0.7)]">
        <div class="absolute inset-x-0 top-0 h-1/2 bg-white/25"></div>
        <div class="absolute inset-0 rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"></div>
        <i class="i-lucide-music absolute inset-0 m-auto w-[30px] h-[30px] text-white/95"></i>
      </div>

      <div class="mt-2 w-full px-4 text-center">
        <div class="text-[10.5px] text-white truncate leading-[14px]">{{ currentTrack?.title ?? '没有曲目' }}</div>
        <div class="text-[9px] text-neutral-500 truncate leading-[12px]">{{ currentTrack?.artist ?? playlistLabel }}</div>
      </div>
    </div>

    <div class="w-full px-4">
      <div class="relative w-full h-[9px] flex items-center cursor-pointer" data-test="progress" @click="seek">
        <div class="w-full h-[2px] rounded-full bg-white/10"></div>
        <div
          class="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full bg-sky-400"
          :style="{ width: `${progressPercent}%` }"
        ></div>
        <div
          class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-white shadow-[0_0_6px_rgba(56,189,248,0.8)]"
          :style="{ left: `${progressPercent}%` }"
        ></div>
      </div>
      <div class="flex justify-between text-[9px] font-mono text-neutral-600 mt-[3px]">
        <span>{{ formatDuration(currentTime) }}</span>
        <span>{{ formatDuration(duration) }}</span>
      </div>
    </div>

    <div class="w-full flex items-center justify-center gap-9">
      <button class="screen-key" title="上一首" @click="prevTrack()">
        <svg class="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="6.2" width="1.7" height="11.6" rx="0.85" />
          <path d="M20 6.9v10.2L12.9 12z" />
          <path d="M13.7 6.9v10.2L6.6 12z" />
        </svg>
      </button>

      <button class="screen-key" :title="isPlaying ? '暂停' : '播放'" @click="togglePlay()">
        <svg v-if="isPlaying" class="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="currentColor">
          <rect x="7" y="5.5" width="3.4" height="13" rx="1.1" />
          <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.1" />
        </svg>
        <svg v-else class="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 5.2 18.4 12 7 18.8z" />
        </svg>
      </button>

      <button class="screen-key" title="下一首" @click="nextTrack()">
        <svg class="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6.9v10.2L11.1 12z" />
          <path d="M10.3 6.9v10.2L17.4 12z" />
          <rect x="18.3" y="6.2" width="1.7" height="11.6" rx="0.85" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  currentTime, currentTrack, duration, isPlaying, nextTrack, prevTrack, progressPercent, seekRatio, togglePlay,
} from '../composables/useAudio'
import { formatDuration } from '../composables/useDevice'
import { playlistLabel } from '../composables/useNav'

function seek(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  seekRatio((event.clientX - rect.left) / rect.width)
}
</script>

<style scoped>
.screen-key {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(228, 228, 231, 0.85);
  transition: color 0.15s ease, transform 0.12s ease;
}

.screen-key:hover {
  color: #fff;
}

.screen-key:active {
  transform: scale(0.9);
}
</style>
