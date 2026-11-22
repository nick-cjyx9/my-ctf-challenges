import { Hono } from "hono";

const app = new Hono()

const sleep = (x: number) => new Promise(r => setTimeout(r, x))

type CouponState = {
  used: boolean
  value: number
}

const FLAG = "flag{await_using_toctou}"
const coupons = new Map<string, CouponState>([
  ["ONCE", { used: false, value: 60 }],
])
const scoreByUser = new Map<string, number>([["guest", 0]])

let requestId = 0

class CouponHandle {
  code: string
  rid: number
  snapshot: CouponState

  constructor(code: string, rid: number) {
    const state = coupons.get(code)
    if (!state) {
      throw new Error("unknown coupon")
    }
    this.code = code
    this.rid = rid
    this.snapshot = { ...state }
    console.log(`m${rid} constructed (used=${this.snapshot.used})`)
  }

  async [Symbol.asyncDispose]() {
    // Deliberately wrong: committing in async cleanup creates a race window.
    await sleep(1000)
    const state = coupons.get(this.code)
    if (state) {
      state.used = true
    }
    console.log(`m${this.rid} disposes`)
  }
}

class AuditHandle {
  rid: number

  constructor(rid: number) {
    this.rid = rid
    console.log(`n${rid} constructed`)
  }

  async [Symbol.asyncDispose]() {
    await sleep(1000)
    console.log(`n${this.rid} disposes`)
  }
}

app.get('/', (c) => {
  return c.text([
    "TOCTOU challenge is running.",
    "Use /redeem?u=guest&code=ONCE then /flag?u=guest",
  ].join("\n"))
})

app.get('/redeem', async (c) => {
  const user = c.req.query('u') ?? 'guest'
  const code = c.req.query('code') ?? 'ONCE'
  const rid = ++requestId

  await using m = new CouponHandle(code, rid)
  await using n = new AuditHandle(rid)

  if (m.snapshot.used) {
    return c.text(`request ${rid}: coupon already used`)
  }

  const current = scoreByUser.get(user) ?? 0
  const next = current + m.snapshot.value
  scoreByUser.set(user, next)

  return c.text(`request ${rid}: +${m.snapshot.value}, total=${next}`)
})

app.get('/flag', (c) => {
  const user = c.req.query('u') ?? 'guest'
  const score = scoreByUser.get(user) ?? 0

  if (score < 100) {
    return c.text(`not enough score: ${score}/100`, 403)
  }

  return c.text(FLAG)
})

app.get('/reset', (c) => {
  coupons.set("ONCE", { used: false, value: 60 })
  scoreByUser.set("guest", 0)
  requestId = 0
  return c.text("state reset")
})

export default app
