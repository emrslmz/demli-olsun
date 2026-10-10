#!/usr/bin/env node
// Demli Olsun görsel üretici.
// Tüm görseller kodla SVG olarak çizilir, Chromium (Playwright) ile görsel dokümanındaki adlar ve boyutlarla
// PNG/JPG'ye dönüştürülür ve public/assets/themes/<tema>/ altına manifest.json ile yazılır.
//
// Kullanım:
//   npm run art                       # tüm temalar
//   npm run art -- --theme=kis        # tek tema
//   npm run art -- --only=char_riza   # kimliği bu önekle başlayanlar
//   npm run art -- --placeholders     # gerçek çizim yerine yer tutucu
//   npm run art -- --review           # kontak sayfaları (assets-work/review/)
//   npm run art -- --icons            # uygulama ikonu ve splash (assets/)
//
// Playwright yerelde yoksa global kurulum kullanılır (npm i -g playwright).

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { catalog, PALETTES, THEMES } from './catalog.mjs'
import { generate } from './gen/index.mjs'
import { placeholderSvg } from './lib/placeholder.mjs'
import { appIconSvgs } from './gen/appicon.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(ROOT, 'public/assets/themes')
const args = process.argv.slice(2)
const arg = (name) => {
  const a = args.find((x) => x.startsWith(`--${name}`))
  if (!a) return undefined
  const eq = a.indexOf('=')
  return eq >= 0 ? a.slice(eq + 1) : true
}

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim()
    return await import(pathToFileURL(path.join(globalRoot, 'playwright', 'index.mjs')).href)
  }
}

function launchOptions() {
  const opts = {}
  const custom = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(custom)) opts.executablePath = custom
  return opts
}

/** SVG'yi verilen boyutta render eder. */
export async function renderSvg(page, svg, w, h, { fmt = 'png', bgColor } = {}) {
  await page.setViewportSize({ width: w, height: h })
  const bg = bgColor ?? 'transparent'
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:${bg};width:${w}px;height:${h}px;overflow:hidden}
    svg{display:block;width:${w}px;height:${h}px}
  </style></head><body>${svg}</body></html>`
  await page.setContent(html, { waitUntil: 'load' })
  if (fmt === 'jpg') return page.screenshot({ type: 'jpeg', quality: 85, omitBackground: false })
  return page.screenshot({ type: 'png', omitBackground: !bgColor })
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/** Var olan manifest'teki elle ayarlanmış çapaları (pivot, spout, counterY, slice) korur; katalogdan çıkan görselleri siler. */
function mergeManifest(existing, fresh) {
  if (!existing) return fresh
  // Yalnızca katalogdaki görseller kalır; elle ayarlanmış çapalar korunur.
  const out = { ...existing, ...fresh, assets: {} }
  for (const [id, a] of Object.entries(fresh.assets)) {
    const prev = existing.assets?.[id] ?? {}
    const keep = {}
    for (const k of ['pivot', 'spout', 'counterY', 'slice']) {
      if (prev[k] !== undefined && !arg('reset-anchors')) keep[k] = prev[k]
    }
    out.assets[id] = { ...prev, ...a, ...keep }
  }
  out.extras = fresh.extras ?? existing.extras
  return out
}

async function buildTheme(page, theme) {
  const palette = PALETTES[theme]
  const only = arg('only')
  const forcePlaceholders = !!arg('placeholders')
  const manifestFile = path.join(OUT, theme, 'manifest.json')
  const existing = readJson(manifestFile)
  const manifest = { theme, version: 1, palette, assets: {}, extras: undefined }
  const extras = { deco: [], particles: [] }
  let count = 0
  for (const a of catalog(theme)) {
    const file = `${a.folder}/${a.id}.${a.fmt}`
    let meta = a.meta ? { ...a.meta } : {}
    const target = path.join(OUT, theme, file)
    if (!only || a.id.startsWith(only)) {
      let svg = null
      if (!forcePlaceholders) {
        const res = await generate(a, { theme, palette })
        if (res) {
          svg = typeof res === 'string' ? res : res.svg
          if (typeof res === 'object' && res.meta) meta = { ...meta, ...res.meta }
        }
      }
      if (!svg) svg = placeholderSvg(a, palette)
      const buf = await renderSvg(page, svg, a.w, a.h, { fmt: a.fmt, bgColor: a.bgColor })
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, buf)
      count++
    } else if (existing?.assets?.[a.id]) {
      meta = { ...meta, ...existing.assets[a.id] }
    }
    manifest.assets[a.id] = { ...meta, file, w: a.w, h: a.h }
    if (a.extra) extras[a.extra].push(a.id)
  }
  if (theme !== 'default') manifest.extras = extras
  const merged = mergeManifest(existing, manifest)
  // Alan sırası: okunaklı olsun.
  const ordered = { theme: merged.theme, version: merged.version, palette: merged.palette, assets: merged.assets }
  if (merged.extras) ordered.extras = merged.extras
  for (const [k, v] of Object.entries(merged)) if (!(k in ordered)) ordered[k] = v
  writeFileSync(manifestFile, JSON.stringify(ordered, null, 2) + '\n')
  console.log(`[art] ${theme}: ${count} görsel`)
}

async function buildContactSheet(page, theme) {
  const manifest = readJson(path.join(OUT, theme, 'manifest.json'))
  if (!manifest) return
  const cells = Object.entries(manifest.assets)
    .map(([id, a]) => {
      const src = pathToFileURL(path.join(OUT, theme, a.file)).href
      return `<figure><div class="pair"><div class="chk"><img src="${src}"></div><div class="drk"><img src="${src}"></div></div><figcaption>${id}</figcaption></figure>`
    })
    .join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:16px;background:#ddd;font:13px/1.2 sans-serif;width:1568px}
    h1{margin:0 0 12px;font-size:20px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
    figure{margin:0;background:#fff;padding:6px;border-radius:6px}
    .pair{display:flex;gap:4px}
    .chk,.drk{flex:1;height:150px;display:flex;align-items:center;justify-content:center}
    .chk{background:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/16px 16px}
    .drk{background:#222}
    img{max-width:100%;max-height:100%}
    figcaption{margin-top:4px;font-family:monospace}
  </style></head><body><h1>Kontak sayfası — ${theme}</h1><div class="grid">${cells}</div></body></html>`
  const dir = path.join(ROOT, 'assets-work/review')
  mkdirSync(dir, { recursive: true })
  const tmp = path.join(dir, `contact_${theme}.html`)
  writeFileSync(tmp, html)
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' })
  await page.screenshot({ path: path.join(dir, `contact_${theme}.png`), fullPage: true })
  console.log(`[art] kontak sayfası: assets-work/review/contact_${theme}.png`)
}

async function buildAppIcons(page) {
  const dir = path.join(ROOT, 'assets')
  mkdirSync(dir, { recursive: true })
  const icons = await appIconSvgs()
  for (const { name, svg, w, h, opaque } of icons) {
    const buf = await renderSvg(page, svg, w, h, { fmt: 'png', bgColor: opaque ? '#1F4E8C' : undefined })
    writeFileSync(path.join(dir, name), buf)
  }
  console.log('[art] uygulama ikonu ve splash: assets/')
}

/** PNG'leri 256 renk paletine indirger (python3 + Pillow varsa; yoksa atlanır). */
function quantize(dirs) {
  if (arg('no-quantize')) return
  try {
    const out = execSync(`python3 ${JSON.stringify(path.join(ROOT, 'tools/art/quantize.py'))} ${dirs.map((d) => JSON.stringify(d)).join(' ')}`)
    process.stdout.write(out.toString())
  } catch {
    console.warn('[art] python3/Pillow yok: palet sıkıştırma atlandı (görseller yine çalışır, yalnızca daha büyük).')
  }
}

async function main() {
  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch(launchOptions())
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  const themeArg = arg('theme')
  const themes = typeof themeArg === 'string' ? [themeArg] : THEMES
  try {
    if (!arg('review-only')) {
      for (const t of themes) await buildTheme(page, t)
      quantize(themes.map((t) => path.join(OUT, t)))
    }
    if (arg('icons') || (!arg('only') && !themeArg)) await buildAppIcons(page)
    if (arg('review') || arg('review-only')) for (const t of themes) await buildContactSheet(page, t)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
