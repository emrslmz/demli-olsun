#!/usr/bin/env node
// Kendi çizdiğin görselleri oyuna alır (ayrıntılar: ASSETS.md).
//
//   custom-assets/<kimlik>.png            → default tema (ör. custom-assets/char_riza_happy.png)
//   custom-assets/<tema>/<kimlik>.png     → yalnızca o tema (kis, yaz, halloween)
//
// Dosya adı görsel kimliğidir; PNG, JPG ya da WebP olabilir. Dosya ilgili tema klasörüne kopyalanır, manifest.json'daki
// kaydı (dosya yolu, genişlik, yükseklik) güncellenir; elle ayarlanmış çapalar (pivot, spout, counterY) korunur.
// `npm run art` de en sonda bunu çalıştırır, yani kodla üretilen görseller seninkilerin üstüne yazılmaz.
//
// Kullanım: npm run art:custom

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { catalog, THEMES } from './catalog.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(ROOT, 'public/assets/themes')
const SRC = path.join(ROOT, 'custom-assets')

/** Katalogda olmayan ama oyunun tanıdığı görseller: kullanıcı bardak katmanları (src/game/art/glassArt.ts). */
const EXTRA = [{ test: /^bardak_(on|ic|arka)(_[a-z0-9]+)?$/, folder: 'glass' }]

/** PNG / JPEG / WebP başlığından boyut. Tanınmazsa null. */
export function imageSize(buf) {
  // PNG: 8 bayt imza + IHDR (genişlik 16, yükseklik 20)
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  // JPEG: SOF0..SOF15 (C4, C8, CC hariç) segmentini ara
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++
        continue
      }
      const marker = buf[i + 1]
      const len = buf.readUInt16BE(i + 2)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) }
      }
      i += 2 + len
    }
    return null
  }
  // WebP: RIFF....WEBP + VP8 / VP8L / VP8X
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const kind = buf.toString('ascii', 12, 16)
    if (kind === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
    if (kind === 'VP8L') {
      const b = buf.readUInt32LE(21)
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }
    }
    if (kind === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
  }
  return null
}

function listImages(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && statSync(path.join(dir, f)).isFile())
}

/** custom-assets/ içeriğini tema klasörlerine uygular. Dönüş: uygulanan görsel sayısı. */
export function applyCustom({ themes = THEMES, log = console.log, warn = console.warn } = {}) {
  if (!existsSync(SRC)) return 0
  const defaults = new Map(catalog('default').map((a) => [a.id, a]))
  let total = 0
  for (const theme of themes) {
    const dir = theme === 'default' ? SRC : path.join(SRC, theme)
    const files = listImages(dir)
    if (files.length === 0) continue
    const manifestFile = path.join(OUT, theme, 'manifest.json')
    if (!existsSync(manifestFile)) {
      warn(`[art:custom] ${theme}: manifest yok, önce npm run art çalıştır.`)
      continue
    }
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    const own = new Map(catalog(theme).map((a) => [a.id, a]))
    let n = 0
    for (const file of files) {
      const ext = path.extname(file).toLowerCase().replace('.jpeg', '.jpg')
      const id = path.basename(file, path.extname(file))
      const entry = own.get(id) ?? defaults.get(id)
      const folder = entry?.folder ?? EXTRA.find((e) => e.test.test(id))?.folder
      if (!folder) {
        warn(`[art:custom] "${file}" tanınmadı: dosya adı bir görsel kimliği olmalı (ASSETS.md). Atlandı.`)
        continue
      }
      const buf = readFileSync(path.join(dir, file))
      const size = imageSize(buf)
      if (!size) {
        warn(`[art:custom] "${file}" okunamadı (PNG, JPG ya da WebP olmalı). Atlandı.`)
        continue
      }
      if (entry && Math.abs(entry.w / entry.h - size.w / size.h) > 0.02) {
        warn(`[art:custom] "${file}" oranı ${size.w}×${size.h}; beklenen ${entry.w}×${entry.h} oranı. Görsel sıkışık/kesik görünebilir.`)
      }
      const rel = `${folder}/${id}${ext}`
      const prev = manifest.assets[id]
      if (prev?.file && prev.file !== rel) rmSync(path.join(OUT, theme, prev.file), { force: true })
      mkdirSync(path.join(OUT, theme, folder), { recursive: true })
      writeFileSync(path.join(OUT, theme, rel), buf)
      manifest.assets[id] = { ...(prev ?? {}), file: rel, w: size.w, h: size.h, custom: true }
      n++
    }
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
    log(`[art:custom] ${theme}: ${n} görsel uygulandı`)
    total += n
  }
  return total
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const n = applyCustom()
  if (n === 0) console.log('[art:custom] custom-assets/ içinde uygulanacak görsel yok.')
}
