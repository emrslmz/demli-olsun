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
function snowTop() {
  const r = rng('snowtop')
  const pts = [[0, 150]]
  for (let x = 0; x <= 1536; x += 64) pts.push([x, 70 + r() * 50])
  pts.push([1536, 150], [1536, 200])
  for (let x = 1536; x >= 0; x -= 96) pts.push([x, 196 + r() * 24 + (x % 192 === 0 ? 30 : 0)])
  const d = smoothPath(pts, true, 0.5)
  let s = silhouette([d], 12) + cel(d, '#FFFFFF', { sw: 7, off: [0, -16], shadow: 0.86, hl: [500, 100, 300, 16], hlOpacity: 0.9 })
  for (let i = 0; i < 24; i++) s += `<circle cx="${f(r() * 1536)}" cy="${f(110 + r() * 80)}" r="${f(3 + r() * 4)}" fill="#CFE8F5"/>`
  // Sarkan buz sarkıtları
  for (let x = 80; x < 1500; x += 140 + r() * 60) s += `<path d="M${f(x)} ${f(205)} l10 ${f(30 + r() * 16)} l10 ${f(-30 - r() * 16)}Z" fill="#CFE8F5" stroke="${C.out}" stroke-width="4" stroke-linejoin="round"/>`
  return strip(s)
}
function snowflakeCorner() {
  let arms = ''
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const x2 = 128 + Math.cos(a) * 96
    const y2 = 128 + Math.sin(a) * 96
    const bx = 128 + Math.cos(a) * 58
    const by = 128 + Math.sin(a) * 58
    arms += `M128 128 L${f(x2)} ${f(y2)} M${f(bx)} ${f(by)} L${f(bx + Math.cos(a + 0.7) * 28)} ${f(by + Math.sin(a + 0.7) * 28)} M${f(bx)} ${f(by)} L${f(bx + Math.cos(a - 0.7) * 28)} ${f(by + Math.sin(a - 0.7) * 28)} `
  }
  return svg(256, 256, line(arms, 26, C.out) + line(arms, 14, '#CFE8F5') + line(arms, 5, '#FFFFFF') + `<circle cx="128" cy="128" r="18" fill="#fff" stroke="${C.out}" stroke-width="6"/>`)
}
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
function vineTop() {
  const r = rng('vine')
  let s = line('M0 70 C300 40 500 110 768 70 S1236 40 1536 80', 22, C.out) + line('M0 70 C300 40 500 110 768 70 S1236 40 1536 80', 12, '#7A5232')
  for (let x = 40; x < 1536; x += 110) {
    const y = 60 + Math.sin(x / 120) * 16
    s += `<path d="${starPath(x, y + 34, 50, 30, 5, r() * 2)}" fill="${r() > 0.5 ? '#4E9A3A' : '#3F8A3A'}" stroke="${C.out}" stroke-width="5" stroke-linejoin="round"/>`
    s += line(`M${x} ${y + 10} l${f(-10 + r() * 20)} 50`, 3, '#2E6B30')
  }
  for (const gx of [260, 760, 1250]) {
    for (let k = 0; k < 15; k++) {
      const row = Math.floor(k / 4)
      const col = k % 4
      if (col > 3 - row * 0.8) continue
      s += `<circle cx="${f(gx + (col - 1.5 + row * 0.4) * 22)}" cy="${f(110 + row * 22)}" r="13" fill="#6A3D8A" stroke="${C.out}" stroke-width="4"/>`
      s += `<circle cx="${f(gx + (col - 1.5 + row * 0.4) * 22 - 4)}" cy="${f(106 + row * 22)}" r="3.5" fill="#fff" opacity=".6"/>`
    }
  }
  return strip(s)
}
function lemonCorner() {
  let segs = ''
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    segs += `<path d="M128 128 L${f(128 + Math.cos(a) * 80)} ${f(128 + Math.sin(a) * 80)}" stroke="#FFFBEA" stroke-width="7"/>`
  }
  return svg(256, 256, silhouette([ellipsePath(128, 128, 104, 104)], 14) + cel(ellipsePath(128, 128, 104, 104), '#F6C445', { sw: 8, inner: `<circle cx="128" cy="128" r="86" fill="#FFE47A"/>${segs}<circle cx="128" cy="128" r="10" fill="#FFFBEA"/>` }))
}
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
function webTop() {
  let s = ''
  for (const [cx, dir] of [
    [0, 1],
    [1536, -1],
    [768, 0],
  ]) {
    if (dir === 0) {
      // Ortada sarkan sevimli örümcek
      s += line('M768 0 V120', 4, '#EDE6D6')
      const body = ellipsePath(768, 150, 32, 30)
      for (let i = 0; i < 4; i++) {
        s += line(`M768 150 q${-40 - i * 6} ${-20 + i * 14} ${-60 - i * 4} ${10 + i * 18}`, 6, C.out) + line(`M768 150 q${40 + i * 6} ${-20 + i * 14} ${60 + i * 4} ${10 + i * 18}`, 6, C.out)
      }
      s += cel(body, '#2B2238', { sw: 6, hl: [756, 136, 10, 6] }) + `<circle cx="757" cy="146" r="7" fill="#fff"/><circle cx="779" cy="146" r="7" fill="#fff"/><circle cx="758" cy="148" r="3.5" fill="#111"/><circle cx="780" cy="148" r="3.5" fill="#111"/><path d="M760 164 q8 6 16 0" stroke="#fff" stroke-width="3" fill="none"/>`
      continue
    }
    const size = 230
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2)
      s += line(`M${cx} 0 L${f(cx + dir * Math.cos(a) * size)} ${f(Math.sin(a) * size)}`, 4, '#EDE6D6')
    }
    for (let k = 1; k <= 4; k++) {
      const rr = (k / 4) * size
      let d = ''
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * (Math.PI / 2)
        d += i === 0 ? `M${f(cx + dir * Math.cos(a) * rr)} ${f(Math.sin(a) * rr)}` : ` Q${f(cx + dir * Math.cos(a - 0.13) * rr * 0.86)} ${f(Math.sin(a - 0.13) * rr * 0.86)} ${f(cx + dir * Math.cos(a) * rr)} ${f(Math.sin(a) * rr)}`
      }
      s += line(d, 3.5, '#EDE6D6')
    }
  }
  // Üst kenar boyunca ince ağ saçağı
  let fringe = 'M0 20'
  for (let x = 0; x <= 1536; x += 96) fringe += ` Q${x + 48} 70 ${x + 96} 20`
  s += line(fringe, 3, '#EDE6D6', 'opacity=".8"')
  return strip(s)
}
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

register((id, ctx) => id === 'deco_board_top' && ctx.theme === 'kis', () => snowTop())
register((id, ctx) => id === 'deco_card_corner' && ctx.theme === 'kis', () => snowflakeCorner())
register((id, ctx) => id === 'deco_counter' && ctx.theme === 'kis', () => salepCounter())
register((id, ctx) => id === 'deco_board_top' && ctx.theme === 'yaz', () => vineTop())
register((id, ctx) => id === 'deco_card_corner' && ctx.theme === 'yaz', () => lemonCorner())
register((id, ctx) => id === 'deco_counter' && ctx.theme === 'yaz', () => watermelonCounter())
register((id, ctx) => id === 'deco_board_top' && ctx.theme === 'halloween', () => webTop())
register((id, ctx) => id === 'deco_card_corner' && ctx.theme === 'halloween', () => pumpkinCorner())
register((id, ctx) => id === 'deco_counter' && ctx.theme === 'halloween', () => lanternCounter())

export { shade, tulipGlass }
