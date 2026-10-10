// Temaya özel dekorlar: tahtanın üst kenar şeridi (yatayda esnetilir, uçları yumuşak), fiş köşesi süsü,
// tezgâh kenarı dekoru (oyun alanını kapatmayacak kadar küçük).

import { register } from './index.mjs'
import { C, cel, ellipsePath, f, line, rng, rrectPath, shade, silhouette, smoothPath, starPath, svg } from '../lib/svg.mjs'
import { tulipGlass } from './icons.mjs'

const FADE = `<linearGradient id="fade" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".06" stop-color="#fff" stop-opacity="1"/><stop offset=".94" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="fm"><rect width="1536" height="256" fill="url(#fade)"/></mask>`

function strip(content) {
  return svg(1536, 256, `<g mask="url(#fm)">${content}</g>`, FADE)
}

// ---------- Kış ----------
function salepCounter() {
  // Tarçınlı salep (fincan) + mandalina tabağı
  let s = ''
  const plate = ellipsePath(330, 400, 160, 42)
  s += silhouette([plate], 14) + cel(plate, '#FBFBF8', { sw: 7, hl: [270, 392, 50, 8] })
  const mand = (x, y, r) => cel(ellipsePath(x, y, r, r * 0.88), '#F08A24', { sw: 6, hl: [x - r * 0.35, y - r * 0.35, r * 0.25, r * 0.15], inner: Array.from({ length: 8 }, (_, i) => `<circle cx="${f(x + Math.cos(i) * r * 0.6)}" cy="${f(y + Math.sin(i * 1.7) * r * 0.5)}" r="2.5" fill="#C96A12"/>`).join('') }) + `<path d="M${x - 4} ${f(y - r * 0.86)} q12 -14 26 -6 q-12 10 -26 6Z" fill="#4E9A3A" stroke="${C.out}" stroke-width="3"/>`
  s += mand(280, 360, 52) + mand(380, 352, 50) + mand(330, 300, 46)
  // Salep fincanı
  const cup = `M60 250 L200 250 Q196 400 130 410 Q64 400 60 250Z`
  s += line('M198 290 C250 290 250 360 190 360', 18, C.out) + line('M198 290 C250 290 250 360 190 360', 9, '#F5F1E8')
  s += silhouette([cup], 14) + cel(cup, '#F5F1E8', { sw: 7, hl: [92, 300, 14, 40], inner: `<rect x="56" y="330" width="150" height="16" fill="${C.cobalt}"/>` })
  s += `<path d="${ellipsePath(130, 250, 70, 18)}" fill="#F3E3C3" stroke="${C.out}" stroke-width="6"/>`
  for (let i = 0; i < 18; i++) s += `<circle cx="${f(90 + ((i * 37) % 80))}" cy="${f(244 + ((i * 13) % 14))}" r="3.4" fill="#8A4B22"/>`
  s += line('M110 230 C96 196 132 182 116 150', 12, '#fff', 'opacity=".8" filter="url(#b2)"')
  return svg(512, 512, s)
}

// ---------- Yaz ----------
function watermelonCounter() {
  let s = ''
  const plate = ellipsePath(256, 410, 220, 54)
  s += silhouette([plate], 14) + cel(plate, '#FBFBF8', { sw: 7, hl: [180, 400, 60, 8], inner: `<path d="${ellipsePath(256, 410, 200, 46)}" fill="none" stroke="${C.cobalt}" stroke-width="6"/>` })
  const slice = (x, y, rot) => {
    const d = `M${x - 90} ${y} A90 90 0 0 0 ${x + 90} ${y}Z`
    return `<g transform="rotate(${rot} ${x} ${y})">` + cel(d, '#E8473E', { sw: 7, inner: `<path d="M${x - 90} ${y} A90 90 0 0 0 ${x + 90} ${y}" stroke="#4E9A3A" stroke-width="18" fill="none"/><path d="M${x - 80} ${y} A80 80 0 0 0 ${x + 80} ${y}" stroke="#F3F1D2" stroke-width="8" fill="none"/>${[[-40, 24], [0, 40], [40, 24], [-20, 56], [22, 58]].map(([dx, dy]) => `<ellipse cx="${x + dx}" cy="${y + dy}" rx="5" ry="8" fill="#2B1A10"/>`).join('')}` }) + `</g>`
  }
  s += slice(170, 330, -8) + slice(330, 330, 8) + slice(250, 280, 0)
  return svg(512, 512, s)
}

// ---------- Halloween ----------
function pumpkinCorner(size = 256, cx = 128, cy = 140) {
  const r = size * 0.36
  const body = smoothPath([[cx, cy - r * 0.8], [cx + r, cy - r * 0.5], [cx + r * 1.1, cy + r * 0.2], [cx + r * 0.7, cy + r * 0.8], [cx, cy + r * 0.85], [cx - r * 0.7, cy + r * 0.8], [cx - r * 1.1, cy + r * 0.2], [cx - r, cy - r * 0.5]])
  return svg(size, size, silhouette([body], 14) +
    cel(`M${cx - 8} ${cy - r * 0.7} q4 -${r * 0.5} 22 -${r * 0.56} l4 12 q-12 6 -14 ${r * 0.44}Z`, '#4E9A3A', { sw: 6 }) +
    cel(body, '#F07C1E', { sw: 8, hl: [cx - r * 0.4, cy - r * 0.3, r * 0.2, r * 0.12], inner: `<path d="M${cx} ${cy - r * 0.8} Q${cx - r * 0.3} ${cy} ${cx} ${cy + r * 0.85} M${cx} ${cy - r * 0.8} Q${cx + r * 0.3} ${cy} ${cx} ${cy + r * 0.85}" stroke="#C25A12" stroke-width="6" fill="none"/>` }) +
    `<circle cx="${cx - r * 0.35}" cy="${cy}" r="${r * 0.1}" fill="${C.out}"/><circle cx="${cx + r * 0.35}" cy="${cy}" r="${r * 0.1}" fill="${C.out}"/><path d="M${cx - r * 0.3} ${cy + r * 0.3} q${r * 0.3} ${r * 0.25} ${r * 0.6} 0" stroke="${C.out}" stroke-width="6" fill="none" stroke-linecap="round"/>`)
}
function lanternCounter() {
  let s = ''
  const cx = 300
  const cy = 330
  const r = 130
  const body = smoothPath([[cx, cy - r * 0.8], [cx + r, cy - r * 0.5], [cx + r * 1.1, cy + r * 0.2], [cx + r * 0.7, cy + r * 0.8], [cx, cy + r * 0.85], [cx - r * 0.7, cy + r * 0.8], [cx - r * 1.1, cy + r * 0.2], [cx - r, cy - r * 0.5]])
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.6}" ry="${r * 1.2}" fill="#FFB347" opacity=".35" filter="url(#b24)"/>`
  s += silhouette([body], 14)
  s += cel(`M${cx - 10} ${cy - r * 0.7} q4 -${r * 0.5} 26 -${r * 0.56} l6 14 q-14 6 -18 ${r * 0.44}Z`, '#4E9A3A', { sw: 6 })
  s += cel(body, '#F07C1E', { sw: 8, hl: [cx - r * 0.45, cy - r * 0.35, r * 0.18, r * 0.1], inner: `<path d="M${cx} ${cy - r * 0.8} Q${cx - r * 0.4} ${cy} ${cx} ${cy + r * 0.85} M${cx} ${cy - r * 0.8} Q${cx + r * 0.4} ${cy} ${cx} ${cy + r * 0.85}" stroke="#C25A12" stroke-width="7" fill="none"/>` })
  s += `<path d="M${cx - r * 0.5} ${cy - r * 0.1} l${r * 0.2} -${r * 0.26} l${r * 0.18} ${r * 0.26}Z M${cx + r * 0.12} ${cy - r * 0.1} l${r * 0.2} -${r * 0.26} l${r * 0.18} ${r * 0.26}Z M${cx - r * 0.5} ${cy + r * 0.25} q${r * 0.5} ${r * 0.36} ${r} 0 l-${r * 0.16} ${r * 0.1} l-${r * 0.12} -${r * 0.08} l-${r * 0.12} ${r * 0.1} l-${r * 0.12} -${r * 0.08} l-${r * 0.12} ${r * 0.1} l-${r * 0.12} -${r * 0.08} Z" fill="#FFE07A" stroke="${C.out}" stroke-width="4" stroke-linejoin="round"/>`
  const candle = (x, y, h) => `<ellipse cx="${x}" cy="${y - h - 16}" rx="${h * 0.7}" ry="${h * 0.7}" fill="#FFD27A" opacity=".4" filter="url(#b14)"/>` + cel(rrectPath(x - 16, y - h, 32, h, 6), '#F3E6C8', { sw: 6 }) + `<path d="M${x} ${y - h - 4} q-12 -14 0 -34 q12 20 0 34Z" fill="#FFB347" stroke="${C.out}" stroke-width="4"/>`
  s += candle(110, 470, 120) + candle(170, 470, 80)
  return svg(512, 512, s)
}

register((id, ctx) => id === 'deco_counter' && ctx.theme === 'kis', () => salepCounter())
register((id, ctx) => id === 'deco_counter' && ctx.theme === 'yaz', () => watermelonCounter())
register((id, ctx) => id === 'deco_counter' && ctx.theme === 'halloween', () => lanternCounter())

export { shade, tulipGlass }
