<template>
  <!-- Full-screen 3D stage: reader panel on the left, MP3 device on the right -->
  <div
    ref="stageRef"
    class="w-screen h-screen overflow-hidden select-none flex items-center justify-center relative"
    :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
    :style="stageStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      class="absolute left-1/2 top-1/2 w-[760px] h-[760px] pointer-events-none opacity-40"
      style="transform: translate(-50%, -50%); background: radial-gradient(circle at 50% 38%, rgba(90,140,220,0.22) 0%, rgba(30,58,138,0.06) 42%, transparent 68%); filter: blur(24px);"
    ></div>
    <div
      class="absolute left-1/2 top-1/2 w-[620px] h-[620px] pointer-events-none opacity-25"
      style="transform: translate(-50%, -50%) rotateX(78deg) translateZ(-210px); background: radial-gradient(circle, rgba(96,165,250,0.5) 0%, rgba(30,58,138,0.12) 45%, transparent 70%); filter: blur(30px);"
    ></div>

   <div class="device-3d-scene relative" :style="sceneStyle">
      <!-- Contact shadow on the floor plane -->
      <div
        class="absolute top-1/2 left-1/2 w-[300px] h-[620px] pointer-events-none rounded-full blur-2xl"
        style="margin: -310px 0 0 -150px; background: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 45%, transparent 72%);"
        :style="floorShadowStyle"
      ></div>

      <!-- INNER SLAB: fills the rounded corners so the shell never looks hollow -->
      <div class="inner-slab">
        <div class="slab-face slab-front"></div>
        <div class="slab-face slab-back"></div>
        <div class="slab-face slab-left"></div>
        <div class="slab-face slab-right"></div>
        <div class="slab-face slab-top"></div>
        <div class="slab-face slab-bottom"></div>
      </div>

      <!-- OUTER SHELL: W270 x H560 x D22 -->
      <div class="device-cube">
        <!-- FRONT -->
        <div class="cube-face face-front">
          <DeviceFront :sheen-offset="frontSheen.offset" :sheen-opacity="frontSheen.opacity" />
        </div>

        <!-- BACK -->
        <div class="cube-face face-back">
          <DeviceBack :sheen-offset="backSheen.offset" :sheen-opacity="backSheen.opacity" />
        </div>

        <!-- LEFT -->
        <div class="cube-face face-left">
          <DeviceSide side="left" />
        </div>

        <!-- RIGHT -->
        <div class="cube-face face-right">
          <DeviceSide side="right" />
        </div>

        <!-- TOP -->
        <div class="cube-face face-top">
          <DeviceTop />
        </div>

        <!-- BOTTOM -->
        <div class="cube-face face-bottom">
          <DeviceBottom />
        </div>
      </div>
    </div>

    <div class="absolute right-[calc(50%+158px)] top-1/2 -translate-y-1/2 z-40">
      <TfReaderPanel />
    </div>

    <!-- Minimal view helper -->
    <div
      class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/5 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10 opacity-40 hover:opacity-100 transition-opacity duration-300 z-50"
      data-test="chrome"
      @pointerdown.stop
    >
      <button
        v-for="view in anglePresets"
        :key="view.name"
        @click="setPresetAngle(view.rx, view.ry)"
        class="px-2.5 py-1 rounded-full hover:bg-white/15 active:scale-95 transition-all text-[11px] whitespace-nowrap"
        :class="isAtPreset(view) ? 'bg-white/20 text-white' : 'text-neutral-400'"
      >
        {{ view.name }}
      </button>

      <span class="w-[1px] h-3 bg-white/15 mx-0.5"></span>

      <button
        @click="toggleAutoRotate"
        class="px-2 py-1 rounded-full hover:bg-white/15 active:scale-95 transition-all text-[11px] flex items-center gap-1"
        :class="isAutoRotating ? 'text-sky-400' : 'text-neutral-400'"
        title="自动旋转"
      >
        <span class="i-lucide-rotate-cw text-[11px]"></span>
        <span>旋转</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DeviceBack from './components/DeviceBack.vue'
import DeviceBottom from './components/DeviceBottom.vue'
import DeviceFront from './components/DeviceFront.vue'
import DeviceSide from './components/DeviceSide.vue'
import DeviceTop from './components/DeviceTop.vue'
import TfReaderPanel from './components/TfReaderPanel.vue'
import { isPoweredOn, togglePlay } from './composables/useAudio'
import { refreshAll, refreshCloud } from './composables/useDevice'
import { nav, view } from './composables/useNav'

/* ------------------------------------------------------------------ *
 * Device shell dimensions (must match the CSS face sizes below)
 * ------------------------------------------------------------------ */
const DEV_W = 270
const DEV_H = 560
const DEV_D = 22

/* ------------------------------------------------------------------ *
 * Rotation state
 * ------------------------------------------------------------------ */
const REST_X = -6
const REST_Y = 14

const rotX = ref(REST_X)
const rotY = ref(REST_Y)
const isDragging = ref(false)
const isAutoRotating = ref(false)

const anglePresets = [
  { name: '正面', rx: 0, ry: 0 },
  { name: '立体', rx: REST_X, ry: REST_Y },
  { name: '背面', rx: 0, ry: 180 },
  { name: '左侧', rx: 0, ry: 90 },
  { name: '右侧', rx: 0, ry: -90 },
  { name: '顶部', rx: -66, ry: 0 },
  { name: '底部', rx: 66, ry: 0 },
]

const sceneStyle = computed(() => ({
  transform: `rotateX(${rotX.value}deg) rotateY(${rotY.value}deg)`,
  transition: (isDragging.value || isAutoRotating.value)
    ? 'none'
    : 'transform 620ms cubic-bezier(0.16, 1, 0.3, 1)',
}))

const stageStyle = {
  perspective: '1400px',
  perspectiveOrigin: '50% 45%',
  touchAction: 'none',
  background:
    'radial-gradient(ellipse 78% 62% at 50% 34%, #171d29 0%, #0d1119 48%, #05060a 100%)',
}

/* ------------------------------------------------------------------ *
 * Derived lighting: reflections slide as the device turns
 * ------------------------------------------------------------------ */
function normDeg(deg: number) {
  return ((deg % 360) + 360) % 360
}

const frontSheen = computed(() => {
  const facing = Math.cos((normDeg(rotY.value) * Math.PI) / 180)
  const visible = Math.max(0, facing)
  const drift = normDeg(rotY.value)
  const signed = drift > 180 ? drift - 360 : drift
  return {
    offset: Math.max(-130, Math.min(130, -signed * 1.6)),
    opacity: 0.08 + visible * 0.3,
  }
})

const backSheen = computed(() => {
  const drift = normDeg(rotY.value - 180)
  const facing = Math.cos((drift * Math.PI) / 180)
  const visible = Math.max(0, facing)
  const signed = drift > 180 ? drift - 360 : drift
  return {
    offset: Math.max(-130, Math.min(130, signed * 1.6)),
    opacity: 0.04 + visible * 0.18,
  }
})

/* Contact shadow tracks the device footprint as it turns */
const floorShadowStyle = computed(() => {
  const ryRad = (rotY.value * Math.PI) / 180
  const rxRad = (rotX.value * Math.PI) / 180
  const cosY = Math.abs(Math.cos(ryRad))
  const sinY = Math.abs(Math.sin(ryRad))
  const cosX = Math.abs(Math.cos(rxRad))

  const footprintX = (DEV_W * cosY + DEV_D * sinY) / DEV_W
  const footprintY = (DEV_W * sinY + DEV_D * cosY) / 300

  return {
    transform: `rotateX(-90deg) translateZ(${DEV_H / 2 + 8}px) scale(${Math.max(0.12, footprintX)}, ${Math.max(0.18, footprintY * 2.2)})`,
    opacity: 0.2 + 0.5 * cosY * cosX,
  }
})

const stageRef = ref<HTMLElement | null>(null)

const DRAG_THRESHOLD = 4
const YAW_PER_PX = 0.52
const PITCH_PER_PX = 0.4

let startX = 0
let startY = 0
let initialRotX = 0
let initialRotY = 0
let activePointer = -1
let dragEngaged = false
let animFrame: number | null = null

function nearestAngle(target: number, current: number) {
  return current + ((((target - current) % 360) + 540) % 360) - 180
}

function setPresetAngle(rx: number, ry: number) {
  isAutoRotating.value = false
  rotX.value = rx
  rotY.value = nearestAngle(ry, rotY.value)
}

function isAtPreset(target: { rx: number, ry: number }) {
  return Math.abs(rotX.value - target.rx) < 0.5 && normDeg(rotY.value - target.ry) < 0.5
}

function toggleAutoRotate() {
  isAutoRotating.value = !isAutoRotating.value
}

function autoRotateLoop() {
  // 不要取模：每帧取模到 0..360 会在回绕那一帧倒转一整圈
  if (isAutoRotating.value && !isDragging.value)
    rotY.value += 0.35
  animFrame = requestAnimationFrame(autoRotateLoop)
}

function shouldIgnoreTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  // 只排除浮在机身之外的控件（底盘工具条 / 左侧读卡器）。
  // 机身本体（包括屏幕上的按钮）都应该能拖 —— 点击与拖动的区分交给 DRAG_THRESHOLD。
  return !!el?.closest?.('[data-no-drag], [data-test="tf-reader"]')
}

function onPointerDown(e: PointerEvent) {
  if (shouldIgnoreTarget(e.target))
    return
  if (e.pointerType === 'mouse' && e.button !== 0)
    return

  // 这里**不**调 setPointerCapture：一旦捕获，click 也会被重定向到舞台，
  // 屏幕上的按钮就点不动了。等真正开始拖（越过阈值）再捕获。
  // 直接覆盖上一次的候选（上一次可能在窗口外松手，没收到 pointerup）。
  activePointer = e.pointerId
  dragEngaged = false
  startX = e.clientX
  startY = e.clientY
  initialRotX = rotX.value
  initialRotY = rotY.value
}

function onPointerMove(e: PointerEvent) {
  if (e.pointerId !== activePointer)
    return

  if (!dragEngaged && e.pointerType === 'mouse' && e.buttons === 0) {
    resetDrag()
    return
  }

  if (!dragEngaged) {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) < DRAG_THRESHOLD)
      return
    dragEngaged = true
    isDragging.value = true
    isAutoRotating.value = false
    startX = e.clientX
    startY = e.clientY
    initialRotX = rotX.value
    initialRotY = rotY.value
    try {
      stageRef.value?.setPointerCapture(e.pointerId)
    }
    catch {  }
  }

  const dx = e.clientX - startX
  const dy = e.clientY - startY
  rotX.value = Math.max(-89, Math.min(89, initialRotX - dy * PITCH_PER_PX))
  rotY.value = initialRotY + dx * YAW_PER_PX
}

function onPointerUp(e: PointerEvent) {
  if (e.pointerId !== activePointer)
    return
  endDrag()
}

function resetDrag() {
  activePointer = -1
  dragEngaged = false
  isDragging.value = false
}

function endDrag() {
  if (activePointer === -1)
    return
  const pointerId = activePointer
  resetDrag()
  try {
    stageRef.value?.releasePointerCapture(pointerId)
  }
  catch { /* 指针已经消失 */ }
  // 注意：这里**不能**对 rotY 取模（见 nearestAngle 的注释）
}

/* ------------------------------------------------------------------ *
 * Keyboard → 设备按键（Shift + 方向键仍可转动查看机身）
 * ------------------------------------------------------------------ */
function handleKeydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA')
    return

  if (e.shiftKey) {
    if (e.code === 'ArrowLeft') { rotY.value -= 8; e.preventDefault() }
    else if (e.code === 'ArrowRight') { rotY.value += 8; e.preventDefault() }
    else if (e.code === 'ArrowUp') { rotX.value = Math.max(-89, rotX.value - 5); e.preventDefault() }
    else if (e.code === 'ArrowDown') { rotX.value = Math.min(89, rotX.value + 5); e.preventDefault() }
    return
  }

  switch (e.code) {
    case 'Space':
      e.preventDefault()
      nav('ok')
      break
    case 'Escape':
    case 'Backspace':
      e.preventDefault()
      nav('return')
      break
    case 'ArrowUp':
      e.preventDefault()
      nav('up')
      break
    case 'ArrowDown':
      e.preventDefault()
      nav('down')
      break
    case 'ArrowLeft':
      e.preventDefault()
      nav('prev')
      break
    case 'ArrowRight':
      e.preventDefault()
      nav('next')
      break
    case 'KeyM':
      e.preventDefault()
      nav('menu')
      break
    case 'KeyP':
      e.preventDefault()
      togglePlay()
      break
  }
}

onMounted(() => {
  animFrame = requestAnimationFrame(autoRotateLoop)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('blur', endDrag)
  void refreshAll()
  void refreshCloud()
})

onUnmounted(() => {
  if (animFrame)
    cancelAnimationFrame(animFrame)
  window.removeEventListener('blur', endDrag)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* =============================== 3D STAGE =============================== */
.device-3d-scene {
  transform-style: preserve-3d;
  will-change: transform;
}

.device-cube {
  position: relative;
  width: 270px;
  height: 560px;
  transform-style: preserve-3d;
}

/* Every face is centred on the cube origin, then pushed out along its own
   normal — this guarantees all six planes meet exactly on the shell edges. */
.cube-face {
  position: absolute;
  top: 50%;
  left: 50%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-origin: center center;
}

/* ---- FRONT  (270 x 560, pushed +11 on Z) ---- */
.face-front {
  width: 270px;
  height: 560px;
  margin: -280px 0 0 -135px;
  transform: translateZ(11px);
}

/* ---- BACK   (270 x 560, flipped, pushed -11 on Z) ---- */
.face-back {
  width: 270px;
  height: 560px;
  margin: -280px 0 0 -135px;
  transform: rotateY(180deg) translateZ(11px);
}

/* Rail faces are TRIMMED to the straight run only (270-2r x 560-2r etc.) so
   their texture ends exactly where the panel's corner arc begins — nothing is
   clipped away by a border-radius, and no stray texture sticks past the arc. */

/* ---- LEFT   (depth 22 x 504, pushed -135 on X) ---- */
.face-left {
  width: 22px;
  height: 504px;
  margin: -252px 0 0 -11px;
  transform: rotateY(-90deg) translateZ(135px);
}

/* ---- RIGHT  (depth 22 x 504, pushed +135 on X) ---- */
.face-right {
  width: 22px;
  height: 504px;
  margin: -252px 0 0 -11px;
  transform: rotateY(90deg) translateZ(135px);
}

/* ---- TOP    (214 x 22, pushed -280 on Y) ---- */
.face-top {
  width: 214px;
  height: 22px;
  margin: -11px 0 0 -107px;
  transform: rotateX(90deg) translateZ(280px);
}

/* ---- BOTTOM (214 x 22, pushed +280 on Y) ---- */
.face-bottom {
  width: 214px;
  height: 22px;
  margin: -11px 0 0 -107px;
  transform: rotateX(-90deg) translateZ(280px);
}

/* =============================== INNER SLAB ==============================
   Sits only 0.5 px inside the shell (0.7 px behind the plates) with the SAME
   corner radius, so the crescent left by the rounded front/back plates is
   sub-pixel and anti-aliasing closes it. It is what makes the corners read
   as solid brushed metal instead of a see-through hole, at every angle.     */
.inner-slab {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 269px;
  height: 559px;
  margin: -279.5px 0 0 -134.5px;
  transform-style: preserve-3d;
}

.slab-face {
  position: absolute;
  top: 50%;
  left: 50%;
  background: linear-gradient(135deg, #e6ebf1 0%, #c6d1dd 34%, #9dabbb 68%, #7e8a98 100%);
}

/* The slab's front/back plates carry the EXACT same 270x560 r28 outline as the
   outer panels, so the crescent they have to cover collapses to zero width and
   the rounded corner reads as solid metal with no light leak at any angle.
   Only the Z offset (0.7px) separates them; the slab's side plates stay inset
   so they never become coplanar with the shell's side rails. */
.slab-front,
.slab-back {
  width: 270px;
  height: 560px;
  margin: -280px 0 0 -135px;
  border-radius: 28px;
}

.slab-front {
  transform: translateZ(10.3px);
}

.slab-back {
  transform: rotateY(180deg) translateZ(10.3px);
}

.slab-left,
.slab-right {
  width: 20.6px;
  height: 504px;
  margin: -252px 0 0 -10.3px;
}

.slab-left {
  transform: rotateY(-90deg) translateZ(134.5px);
}

.slab-right {
  transform: rotateY(90deg) translateZ(134.5px);
}

.slab-top,
.slab-bottom {
  width: 214px;
  height: 20.6px;
  margin: -10.3px 0 0 -107px;
}

.slab-top {
  transform: rotateX(90deg) translateZ(279.5px);
}

.slab-bottom {
  transform: rotateX(-90deg) translateZ(279.5px);
}

/* Corner caps removed: diagonal facets read as stray squares floating around
   the device. The shell is sealed instead by matching the slab's corner radius
   to the outer panels' exactly (see .slab-front / .slab-back). */
</style>
