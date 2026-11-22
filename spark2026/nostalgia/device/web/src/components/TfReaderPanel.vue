<template>
  <!-- 读卡器：黑色玻璃语言的一台小配件，卡插在里面，靠拖拽/点击收文件 -->
  <Transition name="reader">
    <div
      v-if="!tfInserted"
      class="w-[230px] rounded-[16px] bg-[#08090b] border border-white/[0.09] p-3
             shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)]"
      data-test="tf-reader"
      @mousedown.stop
      @touchstart.stop
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <div class="flex items-center gap-2">
        <i class="i-lucide-usb text-[12px] text-neutral-500"></i>
        <span class="text-[9px] tracking-[0.18em] text-neutral-400">CARD READER</span>
        <span class="ml-auto flex items-center gap-1 text-[9px] text-amber-300/80">
          <span class="w-[5px] h-[5px] rounded-full bg-amber-300/80"></span>已拔出
        </span>
      </div>

      <!-- 读卡器里插着的那张卡 -->
      <div class="mt-2.5 rounded-[10px] border border-white/[0.07] bg-white/[0.015] px-2.5 py-2 flex items-center gap-2.5">
        <div class="relative w-[34px] h-[26px] rounded-[3px] shrink-0
                    bg-gradient-to-br from-neutral-700 via-neutral-800 to-black
                    border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          <!-- 金手指 -->
          <div class="absolute left-[2px] top-[2px] bottom-[2px] w-[5px] flex flex-col justify-around">
            <span v-for="n in 4" :key="n" class="block h-[3px] rounded-[1px] bg-amber-300/70"></span>
          </div>
          <div class="absolute right-[3px] top-[3px] w-[8px] h-[6px] rounded-[1px] bg-white/[0.06]"></div>
        </div>
        <div class="min-w-0 leading-tight">
          <div class="text-[10px] text-neutral-200 tracking-wide">SPARK-MP3</div>
          <div class="text-[9px] font-mono text-neutral-600">microSDHC · 16GB</div>
        </div>
      </div>

      <!-- 收文件 -->
      <label
        class="mt-2 block rounded-[10px] border border-dashed border-white/[0.14] hover:border-sky-400/60
               px-3 py-3 text-center cursor-pointer transition-colors"
        :class="busy ? 'opacity-40 pointer-events-none' : ''"
      >
        <input ref="picker" type="file" multiple class="hidden" @change="onPick">
        <i class="i-lucide-plus text-[13px] text-neutral-500"></i>
        <div class="mt-1 text-[10px] text-neutral-400">拖入文件，或点击选择</div>
        <div class="mt-0.5 text-[9px] text-neutral-600">xml · txt · conf · mp3 · jpg ≤ 64KB</div>
      </label>

      <!-- 暂存区 -->
      <div class="mt-2">
        <div
          v-for="file in stage.files"
          :key="file.name"
          class="group h-[25px] flex items-center gap-2 border-b border-white/[0.05] last:border-b-0"
        >
          <i class="i-lucide-file text-[10px] text-neutral-600"></i>
          <span class="text-[10px] text-neutral-300 truncate flex-1">{{ file.name }}</span>
          <span class="text-[9px] font-mono text-neutral-600">{{ formatBytes(file.size) }}</span>
          <button class="opacity-0 group-hover:opacity-100 transition-opacity" title="移除" @click="remove(file.name)">
            <i class="i-lucide-x text-[10px] text-neutral-600 hover:text-red-400"></i>
          </button>
        </div>
        <div v-if="!stage.files.length" class="py-2.5 text-center text-[9px] tracking-[0.2em] text-neutral-700">
          EMPTY
        </div>
      </div>

      <!-- 配额 -->
      <div class="mt-2">
        <div class="h-[2px] rounded-full bg-white/[0.07] overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="overQuota ? 'bg-red-400/90' : 'bg-sky-400/90'"
            :style="{ width: `${quotaPercent}%` }"
          ></div>
        </div>
        <div class="mt-1 flex items-center justify-between text-[9px] font-mono text-neutral-600">
          <span>{{ stage.count }}/{{ stage.max_files }} files</span>
          <span>{{ formatBytes(stage.bytes) }} / {{ formatBytes(stage.max_bytes) }}</span>
        </div>
      </div>

      <div class="mt-2.5 flex items-center gap-2">
        <button class="text-[10px] text-neutral-600 hover:text-neutral-300 transition-colors" @click="clear">清空</button>
        <span class="flex-1"></span>
        <button
          class="h-[26px] px-3.5 rounded-full bg-sky-500 hover:bg-sky-400 active:scale-95
                 text-[10px] font-medium text-white transition-all"
          @click="insert"
        >插入 TF 卡</button>
      </div>

      <div class="mt-2 text-center text-[9px] text-neutral-700">≡ 插入 · ↩ 取消</div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { busy, deleteStageFile, flash, formatBytes, stage, tfInserted, uploadFile } from '../composables/useDevice'
// 插卡必须走 nav 层：它会把视图切回「文件夹」并刷新状态；
// 直接调 insertTf() 会把 view 落在 tf_reader 上，导致下一次「返回」只退一步。
import { insertCard } from '../composables/useNav'

const picker = ref<HTMLInputElement | null>(null)

const quotaPercent = computed(() => Math.min(100, Math.round((stage.value.bytes / stage.value.max_bytes) * 100)))
const overQuota = computed(() => quotaPercent.value >= 90)

async function send(files: FileList | File[] | null) {
  if (!files)
    return
  for (const file of Array.from(files)) {
    try {
      await uploadFile(file)
    }
    catch (err: any) {
      flash(`${file.name}：${err.message}`)
    }
  }
  if (picker.value)
    picker.value.value = ''
}

function onPick(event: Event) {
  void send((event.target as HTMLInputElement).files)
}

function onDrop(event: DragEvent) {
  void send(event.dataTransfer?.files ?? null)
}

async function remove(name: string) {
  try {
    await deleteStageFile(name)
  }
  catch (err: any) {
    flash(err.message)
  }
}

async function clear() {
  try {
    await deleteStageFile()
  }
  catch (err: any) {
    flash(err.message)
  }
}

async function insert() {
  await insertCard()
}
</script>

<style scoped>
.reader-enter-active,
.reader-leave-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.reader-enter-from,
.reader-leave-to {
  opacity: 0;
  transform: translateX(-18px) scale(0.97);
}
</style>
