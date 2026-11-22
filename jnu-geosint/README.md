# Overgrown Ruins — local replica

A local, source-level replica of the public L3akCTF Geosint challenge page. The panorama is set to the Jiangnan University Baidu Street View shared at <https://j.map.baidu.com/76/kkmM> (`panoid=09000100121708021406285055Y`, captured in August 2017).

## Cloudflare Workers preview

Install dependencies and run the same `workerd` runtime used by Cloudflare Workers:

```powershell
pnpm install
pnpm preview
```

Open <http://127.0.0.1:8787/>.

Static files under `public/` are served by Cloudflare Workers Static Assets. Only
`GET /config` and `POST /submit` run through the minified `hono/tiny` Worker.

To deploy, optionally replace the fallback flag with a Worker secret, then deploy:

```powershell
pnpm exec wrangler secret put FLAG
pnpm deploy
```

The panorama and application code are local. The minimap uses the official Baidu Maps JavaScript API GL v1.0 with a browser-side AK. Clicked BD-09 map positions are converted to WGS-84 before submission. Manual WGS-84 latitude/longitude inputs remain usable if the external API is unavailable.

The map panel can be collapsed into a translucent button in the lower-right corner. The selected state is remembered in local storage.

## Local answer checking

The accepted WGS-84 rectangle in `server.js` is inclusive on every edge. A matching
guess returns the configured `FLAG`; local preview falls back to the challenge flag.

The frontend uses these endpoints:

- `GET /config`
- `POST /submit` with `[latitude, longitude]`

Panorama imagery is sourced from Baidu Maps and remains subject to Baidu's applicable terms and attribution requirements. The repository stores a processed 4096×2048 local copy for this replica.
