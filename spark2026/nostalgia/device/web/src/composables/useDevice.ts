/**
 * 设备状态：所有数据都来自容器 A 的固件后端（/api/*）。
 * TF 卡、暂存区、播放列表、云端服务状态都集中在这里，视图只读它。
 */
import { computed, ref } from 'vue'
import type {
  CardInfo, CloudInfo, DeviceFile, ImportResult, StageInfo, Track,
} from '../types'

// ------------------------------------------------------------------ 状态
export const device = ref({
  model: 'MP3-P111511',
  serial: 'SN-111511-0917',
  firmware: '0.6.7-nostalgia',
  tfInserted: true,
})

export const card = ref<CardInfo>({
  label: 'SPARK-MP3', capacity: 16 * 1024 ** 3, used: 0, free: 16 * 1024 ** 3, files: 0,
})

export const files = ref<DeviceFile[]>([])
export const tracks = ref<Track[]>([])
export const playlistSource = ref('card-scan')
export const tfInserted = ref(true)
export const stage = ref<StageInfo>({
  files: [], count: 0, bytes: 0, max_files: 16, max_bytes: 8 * 1024 ** 2,
  max_file_bytes: 64 * 1024, max_media_bytes: 4 * 1024 ** 2, allowed_exts: [],
})
export const cloud = ref<CloudInfo>({ endpoint: 'http://127.0.0.1:8080' })
export const importResult = ref<ImportResult | null>(null)
export const notice = ref('')
export const busy = ref(false)

let noticeTimer: number | null = null

export function flash(message: string, ms = 3200) {
  notice.value = message
  if (noticeTimer)
    clearTimeout(noticeTimer)
  if (ms > 0)
    noticeTimer = window.setTimeout(() => { notice.value = '' }, ms)
}

// ------------------------------------------------------------------ 请求
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init)
  const text = await resp.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  }
  catch {
    data = { error: text.slice(0, 200) }
  }
  if (!resp.ok && !(data && typeof data === 'object' && 'ok' in data))
    throw new Error(data?.error || `请求失败（${resp.status}）`)
  return data as T
}

// ------------------------------------------------------------------ 刷新
export async function refreshDevice() {
  const data = await request<any>('/api/device')
  device.value = { ...device.value, ...data }
  card.value = data.card
  tfInserted.value = data.tfInserted
  cloud.value = { ...cloud.value, endpoint: data.cloud?.endpoint ?? cloud.value.endpoint }
}

export async function refreshFiles() {
  const data = await request<{ entries: DeviceFile[], card: CardInfo, tfInserted: boolean }>('/api/files')
  files.value = data.entries
  card.value = data.card
  tfInserted.value = data.tfInserted
}

export async function refreshPlaylist() {
  const data = await request<{ source: string, tracks: Track[] }>('/api/playlist')
  tracks.value = data.tracks ?? []
  playlistSource.value = data.source
}

export async function refreshStage() {
  stage.value = await request<StageInfo>('/api/device/tf/stage')
}

export async function refreshCloud() {
  try {
    cloud.value = { ...cloud.value, ...(await request<CloudInfo>('/api/ebook/store')) }
  }
  catch (err: any) {
    cloud.value = { ...cloud.value, reachable: false, reason: err.message }
  }
}

export async function refreshAll() {
  busy.value = true
  try {
    await Promise.all([refreshDevice(), refreshFiles(), refreshPlaylist(), refreshStage()])
  }
  catch (err: any) {
    flash(err.message)
  }
  finally {
    busy.value = false
  }
}

// ------------------------------------------------------------------ TF 卡
export async function ejectTf() {
  const data = await request<any>('/api/device/tf/eject', { method: 'POST' })
  tfInserted.value = false
  stage.value = data.stage
  flash('TF 卡已拔出，可以接入读卡器传输文件')
}

export async function insertTf() {
  const data = await request<any>('/api/device/tf/insert', { method: 'POST' })
  tfInserted.value = true
  stage.value = data.stage
  const added: string[] = data.added ?? []
  flash(added.length ? `已插入 TF 卡，新增 ${added.length} 个文件` : 'TF 卡已插入')
  await Promise.all([refreshFiles(), refreshPlaylist()])
}

export async function uploadFile(file: File) {
  const form = new FormData()
  form.append('file', file, file.name)
  const data = await request<any>('/api/device/tf/upload', { method: 'POST', body: form })
  stage.value = data.stage
  flash(`已写入暂存区：${data.name}`)
}

export async function deleteStageFile(name?: string) {
  const query = name ? `?name=${encodeURIComponent(name)}` : ''
  const data = await request<any>(`/api/device/tf/stage${query}`, { method: 'DELETE' })
  stage.value = data.stage
}

// ------------------------------------------------------------------ 播放列表 / 电子书
export async function importXml(name: string): Promise<ImportResult> {
  const result = await request<ImportResult>('/api/playlist/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  importResult.value = result
  if (result.ok)
    await refreshPlaylist()
  return result
}

export async function loadText(name: string): Promise<{ name: string, text: string, size: number }> {
  return request(`/api/files/text?name=${encodeURIComponent(name)}`)
}

// ------------------------------------------------------------------ 派生
export const audioFiles = computed(() => files.value.filter(f => f.kind === 'audio'))
export const ebookFiles = computed(() => files.value.filter(f => f.ebook))
export const xmlFiles = computed(() => files.value.filter(f => f.kind === 'xml'))

export function formatBytes(bytes: number): string {
  if (!bytes)
    return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** i
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}

export function formatDuration(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds))
    return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
