// Uygulama ikonu ve splash: logo_emblem'den birleştirilir (yeni üretim yapılmaz).
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const BLUE = '#1F4E8C'

function emblemDataUrl() {
  const f = path.join(ROOT, 'public/assets/themes/default/logo/logo_emblem.png')
  if (!existsSync(f)) return null
  return `data:image/png;base64,${readFileSync(f).toString('base64')}`
}

/** Hafif çini deseni: köşelerde yıldız-lale motifi tekrarı. */
function tilePattern(size, opacity = 0.12) {
  const s = size / 8
  return `<defs><pattern id="cini" width="${s}" height="${s}" patternUnits="userSpaceOnUse">
    <g fill="none" stroke="#FFFFFF" stroke-opacity="${opacity}" stroke-width="${s * 0.05}">
      <path d="M${s / 2} ${s * 0.12} C ${s * 0.7} ${s * 0.32}, ${s * 0.7} ${s * 0.45}, ${s / 2} ${s * 0.6} C ${s * 0.3} ${s * 0.45}, ${s * 0.3} ${s * 0.32}, ${s / 2} ${s * 0.12} Z"/>
      <circle cx="${s / 2}" cy="${s * 0.75}" r="${s * 0.06}"/>
      <path d="M0 0 L${s * 0.18} 0 M0 0 L0 ${s * 0.18} M${s} ${s} L${s * 0.82} ${s} M${s} ${s} L${s} ${s * 0.82}"/>
    </g></pattern></defs>`
}

export async function appIconSvgs() {
  const em = emblemDataUrl()
  const img = (x, y, w) => (em ? `<image href="${em}" x="${x}" y="${y}" width="${w}" height="${w}"/>` : '')
  const out = []
  out.push({
    name: 'icon-only.png', w: 1024, h: 1024, opaque: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${tilePattern(1024)}
      <rect width="1024" height="1024" fill="${BLUE}"/><rect width="1024" height="1024" fill="url(#cini)"/>${img(72, 72, 880)}</svg>`,
  })
  out.push({
    name: 'icon-foreground.png', w: 1024, h: 1024, opaque: false,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${img(205, 205, 614)}</svg>`,
  })
  out.push({
    name: 'icon-background.png', w: 1024, h: 1024, opaque: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${tilePattern(1024, 0.1)}
      <rect width="1024" height="1024" fill="${BLUE}"/><rect width="1024" height="1024" fill="url(#cini)"/></svg>`,
  })
  out.push({
    name: 'splash.png', w: 2732, h: 2732, opaque: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732">${tilePattern(2732, 0.08)}
      <rect width="2732" height="2732" fill="${BLUE}"/><rect width="2732" height="2732" fill="url(#cini)"/>${img(966, 966, 800)}</svg>`,
  })
  out.push({
    name: 'splash-dark.png', w: 2732, h: 2732, opaque: true,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732">
      <rect width="2732" height="2732" fill="#14325C"/>${img(966, 966, 800)}</svg>`,
  })
  return out
}
