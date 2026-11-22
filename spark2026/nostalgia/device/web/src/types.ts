export interface DeviceFile {
  name: string
  size: number
  mtime: number
  kind: 'audio' | 'text' | 'xml' | 'conf' | 'image' | 'other'
  duration?: number
  playable: boolean
  previewable: boolean
  ebook: boolean
  uploadable: boolean
}

export interface Track {
  title: string
  artist: string
  album: string
  path: string
  duration: number
  bytes: number
}

export interface ImportResult {
  ok: boolean
  source: string
  error?: string
  tracks?: Track[]
  warnings?: string[]
}

export interface StageFile {
  name: string
  size: number
  kind: string
}

export interface StageInfo {
  files: StageFile[]
  count: number
  bytes: number
  max_files: number
  max_bytes: number
  max_file_bytes: number
  max_media_bytes: number
  allowed_exts: string[]
}

export interface CardInfo {
  label: string
  capacity: number
  used: number
  free: number
  files: number
}

export interface CloudInfo {
  endpoint: string
  state?: string
  reachable?: boolean
  /** 固件探活实际请求的路径（会显示在页面上）*/
  health_path?: string
  health?: string
  version?: string
  reason?: string
  items?: unknown[]
}

/** 复古列表里的一行（各页面统一喂给 RetroListView） */
export interface ListRow {
  key: string
  label: string
  sub?: string
  meta?: string
  icon?: string
  iconClass?: string
  dim?: boolean
}

export type MenuId =
  | 'music' | 'video' | 'dict' | 'ebook' | 'folder'
  | 'record' | 'tools' | 'settings' | 'bluetooth'

export interface MenuItem {
  id: MenuId
  name: string
  icon: string
  tile: string
  dark?: boolean
}
