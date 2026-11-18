// Статический сервер для dist/, повторяющий поведение GitHub Pages:
// /about → about.html, /dir/ → dir/index.html, неизвестный адрес → 404.html со статусом 404.
// Запуск: node scripts/serve-dist.mjs [порт]
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = join(process.cwd(), 'dist')
const port = Number(process.argv[2] ?? 4173)
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
}
const file = (p) => existsSync(p) && statSync(p).isFile() ? p : null

createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const safe = normalize(url).replace(/^(\.\.[/\\])+/, '')
  const base = join(root, safe)
  const found = file(base) ?? file(base + '.html') ?? file(join(base, 'index.html'))
  const path = found ?? file(join(root, '404.html'))
  res.writeHead(found ? 200 : 404, {
    'Content-Type': types[extname(path)] ?? 'application/octet-stream',
    'Cache-Control': safe.startsWith('/assets/') || safe.startsWith('/img/') ? 'public, max-age=31536000, immutable' : 'public, max-age=600',
  })
  res.end(readFileSync(path))
}).listen(port, () => console.log(`dist → http://localhost:${port}`))
