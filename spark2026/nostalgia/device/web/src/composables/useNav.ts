/**
 * 按键路由：把机身上的 7 个硬件键（↩ △ ▼ ≡ ⏮ ⏯ ⏭）映射成「当前视图该做的事」。
 * 这是整个复古交互的大脑 —— 视图组件只负责渲染，导航逻辑集中在这里。
 */
import { computed, ref } from 'vue'
import type { ListRow, MenuItem } from '../types'
import {
  ebookFiles, files, flash, formatBytes, formatDuration, importXml,
  insertTf, ejectTf, loadText, playlistSource, refreshCloud, refreshFiles,
  refreshPlaylist, refreshStage, tfInserted, tracks, xmlFiles,
} from './useDevice'
import {
  adjustVolume, currentIndex, isPlaying, nextTrack, playIndex, prevTrack, togglePlay,
} from './useAudio'
import { pageCount, pageOf, wrapText } from '../utils/paginate'
import { isBluetoothOn } from './useSettings'

export type ViewId =
  | 'home' | 'music_list' | 'music_player' | 'folder' | 'folder_hint'
  | 'text_preview' | 'ebook_list' | 'ebook_reader' | 'ebook_store'
  | 'import_menu' | 'settings' | 'stub' | 'tf_reader'

export const view = ref<ViewId>('home')
export const previousView = ref<ViewId>('home')
export const homeCursor = ref(0)
export const cursor = ref(0)
export const windowStart = ref(0)
export const docLine = ref(0)
export const stubTitle = ref('')
export const activeDoc = ref<{ name: string, kind: string, lines: string[] } | null>(null)

export const PER_PAGE = 6
/** 阅读区一页的行数（顶栏页码 + 14 行正文 + 进度条 + 文件名脚注） */
export const DOC_LINES = 14
/** 阅读区：宽 220 / 高 13 行，字号 11px，行高 13px */
export const DOC_FONT = '11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
export const DOC_WIDTH = 220

// ------------------------------------------------------------------ 首页菜单（真机是 3×3 九宫格）
// 图标顺序与配色照着真机截图：深色块配白图形，浅色块（录音/工具/设置/蓝牙）配深色图形
export const HOME_MENU: MenuItem[] = [
  { id: 'music', name: '音乐', icon: 'i-lucide-music', tile: 'from-[#5aa9ff] to-[#2f76d8]' },
  { id: 'video', name: '视频', icon: 'i-lucide-clapperboard', tile: 'from-[#63d381] to-[#26a052]' },
  { id: 'dict', name: '词典', icon: 'i-lucide-book-a', tile: 'from-[#cba646] to-[#8a6a1c]' },
  { id: 'record', name: '录音', icon: 'i-lucide-mic', tile: 'from-[#f2ead4] to-[#d3c7a4]', dark: true },
  { id: 'ebook', name: '电子书', icon: 'i-lucide-book-open', tile: 'from-[#4fca85] to-[#1e9155]' },
  { id: 'folder', name: '文件夹', icon: 'i-lucide-folder', tile: 'from-[#59acec] to-[#2b7cc4]' },
  { id: 'tools', name: '工具', icon: 'i-lucide-wrench', tile: 'from-[#63dcd2] to-[#2ba79c]', dark: true },
  { id: 'settings', name: '设置', icon: 'i-lucide-settings', tile: 'from-[#d6e253] to-[#9aad1f]', dark: true },
  { id: 'bluetooth', name: '蓝牙', icon: 'i-lucide-bluetooth', tile: 'from-[#a6ea88] to-[#5fb93f]', dark: true },
]

const HOME_COLS = 3
const HOME_TOTAL = HOME_MENU.length

const STORE_KEY = '__store__'

const KIND_ICON: Record<string, string> = {
  audio: 'i-lucide-file-audio',
  xml: 'i-lucide-file-code',
  conf: 'i-lucide-file-cog',
  text: 'i-lucide-file-text',
  image: 'i-lucide-file-image',
  other: 'i-lucide-file',
}

// ------------------------------------------------------------------ 行数据
function fileRow(name: string, sub: string, meta: string, icon: string, extra: Partial<ListRow> = {}): ListRow {
  return { key: name, label: name, sub, meta, icon, ...extra }
}

export const rows = computed<ListRow[]>(() => {
  switch (view.value) {
    case 'music_list':
      return tracks.value.map((t, i) => ({
        key: t.path || String(i),
        label: t.title,
        sub: t.artist,
        meta: formatDuration(t.duration),
        icon: i === currentIndex.value && isPlaying.value ? 'i-lucide-play' : 'i-lucide-music',
        iconClass: i === currentIndex.value ? 'text-sky-400' : 'text-blue-400',
      }))

    case 'folder':
    case 'tf_reader':
      // 卡片拔出（tf_reader）时仍然显示最后一次扫描到的内容
      return files.value.map(f => fileRow(
        f.name,
        `${f.kind.toUpperCase()}${f.size ? ` · ${formatBytes(f.size)}` : ''}`,
        f.kind === 'audio' && f.duration ? formatDuration(f.duration) : '',
        KIND_ICON[f.kind] ?? 'i-lucide-file',
        { iconClass: f.kind === 'audio' ? 'text-blue-400' : f.kind === 'xml' ? 'text-emerald-400' : f.kind === 'conf' ? 'text-amber-400' : 'text-neutral-400' },
      ))

    case 'ebook_list': {
      const list: ListRow[] = [{
        key: STORE_KEY,
        label: '在线书库（建设中）',
        sub: '下载源正在接入…',
        meta: '...',
        icon: 'i-lucide-cloud-download',
        iconClass: 'text-amber-400',
      }]
      list.push(...ebookFiles.value.map(f => fileRow(f.name, `电子书 · ${formatBytes(f.size)}`, '', 'i-lucide-book-open', { iconClass: 'text-amber-400' })))
      return list
    }

    case 'import_menu': {
      const list = xmlFiles.value.map(f => fileRow(f.name, `播放列表 · ${formatBytes(f.size)}`, '', 'i-lucide-file-code', { iconClass: 'text-emerald-400' }))
      if (!list.length) {
        list.push({
          key: '__none__',
          label: '卡内没有 .xml 播放列表',
          sub: tfInserted.value ? '请先拔出 TF 卡，传入播放列表文件' : '可在左侧读卡器上传后再插入',
          icon: 'i-lucide-triangle-alert',
          iconClass: 'text-amber-400',
          dim: true,
        })
      }
      return list
    }

    case 'settings':
      return [
        { key: 'bluetooth', label: '蓝牙', sub: isBluetoothOn.value ? '已开启' : '已关闭', meta: isBluetoothOn.value ? 'ON' : 'OFF', icon: 'i-lucide-bluetooth', iconClass: 'text-blue-400' },
        { key: 'backlight', label: '屏幕背光', sub: '100%', meta: '100%', icon: 'i-lucide-sun', iconClass: 'text-amber-400' },
        { key: 'store', label: '云端服务状态', sub: '电子书云同步（建设中）', meta: '›', icon: 'i-lucide-cloud', iconClass: 'text-cyan-400' },
        { key: 'model', label: '设备型号', sub: 'MP3-P111511', meta: '', icon: 'i-lucide-info', iconClass: 'text-emerald-400', dim: true },
      ]

    default:
      return []
  }
})

export const currentRow = computed<ListRow | null>(() => rows.value[cursor.value] ?? null)

// ------------------------------------------------------------------ 视图切换
export function goto(next: ViewId) {
  if (view.value !== next && view.value !== 'tf_reader')
    previousView.value = view.value
  view.value = next
  cursor.value = 0
  windowStart.value = 0
  docLine.value = 0
}

function enterMenu(index: number) {
  const item = HOME_MENU[index]
  if (!item)
    return
  switch (item.id) {
    case 'music':
      goto('music_list')
      void refreshPlaylist()
      break
    case 'ebook':
      goto('ebook_list')
      void refreshFiles()
      break
    case 'folder':
      goto('folder')
      void refreshFiles()
      break
    case 'settings':
      goto('settings')
      break
    default:
      // 视频 / 词典 / 录音 / 工具 / 蓝牙：真机有图标，固件里还是占位页
      stubTitle.value = item.name
      goto('stub')
  }
}

// ------------------------------------------------------------------ 列表光标
function items(): ListRow[] {
  return rows.value
}

function moveCursor(delta: number) {
  const total = items().length
  if (!total)
    return
  cursor.value = Math.max(0, Math.min(total - 1, cursor.value + delta))
  if (cursor.value < windowStart.value)
    windowStart.value = cursor.value
  if (cursor.value >= windowStart.value + PER_PAGE)
    windowStart.value = cursor.value - PER_PAGE + 1
}

function pageCursor(direction: number) {
  const total = items().length
  if (!total)
    return
  const page = Math.floor(cursor.value / PER_PAGE)
  const target = Math.max(0, Math.min(Math.ceil(total / PER_PAGE) - 1, page + direction))
  cursor.value = Math.min(total - 1, target * PER_PAGE)
  windowStart.value = target * PER_PAGE
}

// ------------------------------------------------------------------ 文档
export async function openDoc(name: string, kind: 'text' | 'ebook') {
  try {
    const data = await loadText(name)
    activeDoc.value = { name, kind, lines: wrapText(data.text, DOC_WIDTH - 15, DOC_FONT) }
    docLine.value = 0
    previousView.value = view.value
    view.value = kind === 'ebook' ? 'ebook_reader' : 'text_preview'
  }
  catch (err: any) {
    flash(err.message)
  }
}

export const docPages = computed(() => (activeDoc.value ? pageCount(activeDoc.value.lines, DOC_LINES) : 1))
export const docPage = computed(() => pageOf(docLine.value, DOC_LINES))

function docScroll(delta: number) {
  const total = activeDoc.value?.lines.length ?? 0
  docLine.value = Math.max(0, Math.min(Math.max(0, total - 1), docLine.value + delta))
}

function docPageTurn(direction: number) {
  const target = Math.max(1, Math.min(docPages.value, docPage.value + direction))
  docLine.value = (target - 1) * DOC_LINES
}

// ------------------------------------------------------------------ 确认
function confirmRow(row: ListRow) {
  switch (view.value) {
    case 'music_list': {
      const index = tracks.value.findIndex(t => (t.path || '') === row.key)
      playIndex(index < 0 ? cursor.value : index)
      goto('music_player')
      break
    }
    case 'folder': {
      const file = files.value.find(f => f.name === row.key)
      if (!file)
        break
      if (file.playable) {
        const index = tracks.value.findIndex(t => t.path === file.name)
        if (index < 0)
          flash('该文件不在当前播放列表里，请先导入播放列表')
        else {
          playIndex(index)
          goto('music_player')
        }
      }
      else if (file.ebook) {
        void openDoc(file.name, 'ebook')
      }
      else if (file.previewable) {
        void openDoc(file.name, 'text')
      }
      else {
        flash('设备不支持打开这个文件类型')
      }
      break
    }
    case 'ebook_list': {
      if (row.key === STORE_KEY) {
        goto('ebook_store')
        void refreshCloud()
      }
      else {
        const file = ebookFiles.value.find(f => f.name === row.key)
        if (file)
          void openDoc(file.name, 'ebook')
      }
      break
    }
    case 'import_menu': {
      if (row.key.startsWith('__'))
        break
      void runImport(row.key)
      break
    }
    case 'settings': {
      if (row.key === 'bluetooth')
        isBluetoothOn.value = !isBluetoothOn.value
      else if (row.key === 'store') {
        goto('ebook_store')
        void refreshCloud()
      }
      break
    }
    case 'ebook_store':
      void refreshCloud()
      flash('书库仍在建设中，稍后再试')
      break
  }
}

/** 导入就是「换一张播放列表」：成功就回列表，失败只给一句提示。 */
async function runImport(name: string) {
  try {
    const result = await importXml(name)
    goto('music_list')
    flash(result.ok
      ? `已导入《${name}》，共 ${result.tracks?.length ?? 0} 首`
      : `导入失败：${result.error ?? '播放列表格式不正确'}`)
  }
  catch (err: any) {
    flash(err.message)
  }
}

// ------------------------------------------------------------------ 7 键路由
export function nav(action: 'return' | 'up' | 'down' | 'menu' | 'prev' | 'next' | 'ok') {
  switch (view.value) {
    case 'tf_reader':
      if (action === 'menu' || action === 'ok')
        void insertCard()
      else if (action === 'return')
        goto('folder')
      return

    case 'home':
      if (action === 'up')
        homeCursor.value = (homeCursor.value - HOME_COLS + HOME_TOTAL) % HOME_TOTAL
      else if (action === 'down')
        homeCursor.value = (homeCursor.value + HOME_COLS) % HOME_TOTAL
      else if (action === 'prev')
        homeCursor.value = (homeCursor.value + HOME_TOTAL - 1) % HOME_TOTAL
      else if (action === 'next')
        homeCursor.value = (homeCursor.value + 1) % HOME_TOTAL
      else if (action === 'ok' || action === 'menu')
        enterMenu(homeCursor.value)
      return

    case 'music_player':
      if (action === 'return' || action === 'menu')
        goto('music_list')
      else if (action === 'up')
        adjustVolume(5)
      else if (action === 'down')
        adjustVolume(-5)
      else if (action === 'prev')
        prevTrack()
      else if (action === 'next')
        nextTrack()
      else if (action === 'ok')
        togglePlay()
      return

    case 'text_preview':
    case 'ebook_reader':
      if (action === 'up')
        docScroll(-1)
      else if (action === 'down')
        docScroll(1)
      else if (action === 'prev')
        docPageTurn(-1)
      else if (action === 'next')
        docPageTurn(1)
      else if (action === 'return')
        goto(previousView.value === view.value ? 'folder' : previousView.value)
      return

    case 'folder':
      if (action === 'up')
        moveCursor(-1)
      else if (action === 'down')
        moveCursor(1)
      else if (action === 'prev')
        pageCursor(-1)
      else if (action === 'next')
        pageCursor(1)
      else if (action === 'ok' && currentRow.value)
        confirmRow(currentRow.value)
      else if (action === 'menu')
        void ejectCard()
      else if (action === 'return')
        goto('home')
      return

    case 'ebook_list':
      if (action === 'up')
        moveCursor(-1)
      else if (action === 'down')
        moveCursor(1)
      else if (action === 'prev')
        pageCursor(-1)
      else if (action === 'next')
        pageCursor(1)
      else if (action === 'ok' && currentRow.value)
        confirmRow(currentRow.value)
      else if (action === 'menu') {
        goto('ebook_store')
        void refreshCloud()
      }
      else if (action === 'return')
        goto('home')
      return

    case 'music_list':
      if (action === 'up')
        moveCursor(-1)
      else if (action === 'down')
        moveCursor(1)
      else if (action === 'prev')
        pageCursor(-1)
      else if (action === 'next')
        pageCursor(1)
      else if (action === 'ok' && currentRow.value)
        confirmRow(currentRow.value)
      else if (action === 'menu')
        void openImportMenu()
      else if (action === 'return')
        goto('home')
      return

    case 'import_menu':
    case 'settings':
    case 'ebook_store':
      if (action === 'up')
        moveCursor(-1)
      else if (action === 'down')
        moveCursor(1)
      else if (action === 'prev')
        pageCursor(-1)
      else if (action === 'next')
        pageCursor(1)
      else if (action === 'ok' && currentRow.value)
        confirmRow(currentRow.value)
      else if (action === 'menu' && view.value === 'import_menu')
        void ejectCard()
      else if (action === 'return')
        goto(view.value === 'import_menu' ? 'music_list' : view.value === 'ebook_store' ? 'ebook_list' : 'home')
      return

    case 'stub':
      if (action === 'return' || action === 'ok' || action === 'menu')
        goto('home')
      return
  }
}

// ------------------------------------------------------------------ TF 卡动作
export async function ejectCard() {
  if (!tfInserted.value) {
    goto('tf_reader')
    return
  }
  try {
    await ejectTf()
    await refreshStage()
    goto('tf_reader')
  }
  catch (err: any) {
    flash(err.message)
  }
}

export async function insertCard() {
  try {
    await insertTf()
    goto('folder')
    await Promise.all([refreshFiles(), refreshStage(), refreshPlaylist()])
  }
  catch (err: any) {
    flash(err.message)
  }
}

async function openImportMenu() {
  await refreshFiles()
  if (!xmlFiles.value.length) {
    flash(tfInserted.value
      ? '卡内没有播放列表：请先在文件夹里拔出 TF 卡传入 .xml'
      : '请在左侧读卡器上传 .xml 后再插入 TF 卡')
  }
  goto('import_menu')
}

/** 视图底部那一行按键提示 */
export const footerHint = computed(() => {
  switch (view.value) {
    case 'home': return '⏯ 进入   ⏮⏭ 移动'
    case 'music_list': return '⏯ 播放   ≡ 导入 XML'
    case 'music_player': return '⏯ 播放/暂停   ⏮⏭ 切歌   △▼ 音量'
    case 'folder': return '⏯ 打开   ≡ 拔出 TF 卡'
    case 'ebook_list': return '⏯ 打开   ≡ 在线书库'
    case 'ebook_reader':
    case 'text_preview': return '⏮⏭ 翻页   △▼ 滚动   ↩ 返回'
    case 'ebook_store': return '⏯ 刷新   ↩ 返回'
    case 'import_menu': return '⏯ 导入选中 XML   ↩ 返回'
    case 'settings': return '⏯ 切换   ↩ 返回'
    case 'tf_reader': return '≡ 插入 TF 卡   ↩ 取消'
    default: return '↩ 返回'
  }
})

export const playlistLabel = computed(() => (playlistSource.value === 'card-scan' ? 'TF 卡扫描' : playlistSource.value))
