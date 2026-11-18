// Конвертирует исходные изображения в WebP нескольких размеров.
// Запуск: node scripts/optimize-images.mjs <папка_с_исходниками>
import sharp from 'sharp'
import { readdirSync, mkdirSync } from 'node:fs'
import { join, parse } from 'node:path'

const src = process.argv[2]
const out = 'public/img/p'
mkdirSync(out, { recursive: true })
const WIDTHS = [320, 640, 960]
for (const f of readdirSync(src)) {
  const { name, ext } = parse(f)
  if (!/^\d+$/.test(name) || !/\.(jpe?g|png)$/i.test(ext)) continue
  const meta = await sharp(join(src, f)).metadata()
  for (const w of WIDTHS) {
    if (w > (meta.width ?? w) && w !== WIDTHS[0]) continue
    await sharp(join(src, f)).resize({ width: Math.min(w, meta.width ?? w) }).webp({ quality: 82 }).toFile(join(out, `${name}-${w}.webp`))
  }
}
