// Конвертирует исходные изображения в WebP нескольких размеров и пишет манифест src/data/images.json
// (размеры + доступные ширины для srcset). Запуск: node scripts/optimize-images.mjs <папка_с_исходниками>
import sharp from 'sharp'
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, parse } from 'node:path'

const src = process.argv[2]
const out = 'public/img/p'
mkdirSync(out, { recursive: true })
const WIDTHS = [320, 640, 960]
const manifest = {}
for (const f of readdirSync(src).sort()) {
  const { name, ext } = parse(f)
  if (!/^\d+$/.test(name) || !/\.(jpe?g|png)$/i.test(ext)) continue
  const meta = await sharp(join(src, f)).metadata()
  // ширины из набора, меньшие оригинала, + сам оригинал (но не шире 960)
  const widths = [...new Set([...WIDTHS.filter((w) => w < meta.width), Math.min(meta.width, 960)])]
  for (const width of widths) {
    await sharp(join(src, f)).resize({ width }).webp({ quality: 82 }).toFile(join(out, `${name}-${width}.webp`))
  }
  manifest[name] = { w: meta.width, h: meta.height, widths }
}
writeFileSync('src/data/images.json', JSON.stringify(manifest))
