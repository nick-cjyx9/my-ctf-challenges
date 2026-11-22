export interface ExtraSkill {
  name: string
}

/** 后端 /api/catalog 下发的一条商品。 */
export interface CatalogProduct {
  goods: string
  name: string
  price: number
  iconType: string
  description: string
  extraSkill?: ExtraSkill | null
  sellable: boolean
}

/** 前端渲染用的商品：目录 + 当前会话的持有数量。 */
export interface Product extends CatalogProduct {
  owned: number
}

export interface CatalogResponse {
  ok: boolean
  products: CatalogProduct[]
}

export interface StatusResponse {
  ok: boolean
  wallet: number
  inventory: Record<string, number>
}

export interface OrderResponse {
  ok: boolean
  message?: string
  goods?: string
  wallet?: number
  owned?: number
  serial?: string
}

export type OrderAction = 'buy' | 'sell'

export class ApiError extends Error {
  status: number
  /** 网关（nginx）拦截时会返回 HTML，这里留一份截断后的原文。 */
  detail: string

  constructor(status: number, detail: string) {
    super(detail || `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', ...init })
  const text = (await res.text()).trim()

  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* 网关卡返回的不是 JSON */
  }

  if (!res.ok) {
    const detail = data?.message ?? text.replace(/\s+/g, ' ').slice(0, 120)
    throw new ApiError(res.status, detail)
  }
  return data as T
}

export function fetchCatalog(): Promise<CatalogProduct[]> {
  return request<CatalogResponse>('/api/catalog').then(r => r.products ?? [])
}

export function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>('/api/status')
}

/** 把目录与会话状态合并成前端直接可渲染的商品列表。 */
export async function loadStore(): Promise<{ wallet: number; products: Product[] }> {
  const [catalog, status] = await Promise.all([fetchCatalog(), fetchStatus()])
  const products = catalog.map(p => ({ ...p, owned: status.inventory[p.goods] ?? 0 }))
  return { wallet: status.wallet, products }
}

export function submitOrder(
  action: OrderAction,
  goods: string,
  count: number
): Promise<OrderResponse> {
  return request<OrderResponse>('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, goods, count })
  })
}
