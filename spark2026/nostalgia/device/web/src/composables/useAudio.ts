/**
 * 播放引擎：一个单例 <audio>，对接设备上的音频文件（带 Range 的 /api/files/audio）。
 * 时长用浏览器解出来的真实 metadata；播放/暂停/上一曲/下一曲与硬件按键联动。
 */
import { computed, ref, watch } from 'vue'
import { formatDuration, tracks } from './useDevice'

// ------------------------------------------------------------------ 电源 / 音量（原底子保留）
export const isPoweredOn = ref(true)
export const isScreenOn = ref(true)
export const volume = ref(60)
export const isMuted = ref(false)
export const showVolumeOverlay = ref(false)

import { synth } from '../utils/audioSynth'

let volumeTimer: number | null = null

export function triggerVolumeOverlay() {
  showVolumeOverlay.value = true
  if (volumeTimer)
    clearTimeout(volumeTimer)
  volumeTimer = window.setTimeout(() => { showVolumeOverlay.value = false }, 2000)
}

export function adjustVolume(delta: number) {
  if (!isPoweredOn.value)
    return
  volume.value = Math.max(0, Math.min(100, volume.value + delta))
  isMuted.value = volume.value === 0
  el.volume = volume.value / 100
  synth.playBeep(400 + volume.value * 5, 0.03)
  triggerVolumeOverlay()
}

// ------------------------------------------------------------------ 播放状态
export const currentIndex = ref(0)
export const isPlaying = ref(false)
export const currentTime = ref(0)
export const duration = ref(0)

export const currentTrack = computed(() => tracks.value[currentIndex.value] ?? null)
export const progressPercent = computed(() => (duration.value ? Math.min(100, (currentTime.value / duration.value) * 100) : 0))

const el = typeof Audio !== 'undefined' ? new Audio() : null!

if (el) {
  el.preload = 'metadata'
  el.volume = volume.value / 100

  el.addEventListener('timeupdate', () => { currentTime.value = el.currentTime })
  el.addEventListener('durationchange', () => { duration.value = Number.isFinite(el.duration) ? el.duration : 0 })
  el.addEventListener('loadedmetadata', () => {
    duration.value = Number.isFinite(el.duration) ? el.duration : 0
    const track = currentTrack.value
    if (track && duration.value)
      track.duration = Math.round(duration.value)
  })
  el.addEventListener('play', () => { isPlaying.value = true })
  el.addEventListener('pause', () => { isPlaying.value = false })
  el.addEventListener('ended', () => { nextTrack(true) })
  el.addEventListener('error', () => { isPlaying.value = false; duration.value = 0 })
}

function sourceOf(index: number): string | null {
  const track = tracks.value[index]
  if (!track?.path)
    return null
  return `/api/files/audio?name=${encodeURIComponent(track.path)}`
}

export function loadTrack(index: number, autoplay = false) {
  if (!el || !tracks.value.length)
    return
  currentIndex.value = Math.max(0, Math.min(tracks.value.length - 1, index))
  const src = sourceOf(currentIndex.value)
  currentTime.value = 0
  duration.value = 0
  if (!src)
    return
  el.src = src
  if (autoplay)
    void el.play().catch(() => { isPlaying.value = false })
}

export function togglePlay() {
  if (!el || !isPoweredOn.value)
    return
  if (!tracks.value.length)
    return
  if (!el.src)
    loadTrack(currentIndex.value, true)
  else if (el.paused)
    void el.play().catch(() => {})
  else
    el.pause()
  synth.playBeep(600, 0.04)
}

export function playIndex(index: number) {
  loadTrack(index, true)
}

export function nextTrack(keepPlaying = false) {
  if (!tracks.value.length)
    return
  loadTrack(currentIndex.value + 1 >= tracks.value.length ? 0 : currentIndex.value + 1,
    keepPlaying || isPlaying.value)
  synth.playBeep(700, 0.03)
}

export function prevTrack() {
  if (!tracks.value.length)
    return
  if (el && el.currentTime > 3) {
    el.currentTime = 0
    return
  }
  loadTrack(currentIndex.value - 1 < 0 ? tracks.value.length - 1 : currentIndex.value - 1, isPlaying.value)
  synth.playBeep(500, 0.03)
}

export function seekRatio(ratio: number) {
  if (!el || !duration.value)
    return
  el.currentTime = Math.max(0, Math.min(1, ratio)) * duration.value
  currentTime.value = el.currentTime
}

export const totalDuration = computed(() => formatDuration(duration.value))

watch(isPoweredOn, (on) => {
  if (!on && el) {
    el.pause()
    synth.stopMelody()
  }
})

// 播放列表变化（例如刚导入了新列表）时，重置到第一首
watch(tracks, () => {
  if (el)
    el.pause()
  currentIndex.value = 0
  currentTime.value = 0
  duration.value = 0
  if (el)
    el.removeAttribute('src')
})
