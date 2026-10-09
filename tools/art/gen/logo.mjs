// logo_emblem (1024, saydam): tabağında buharı tüten ince belli bir bardak çay; arkasında çini motifli
// yuvarlak madalyon. Yazı yok — oyunun adını kod fontla basar. Temalara göre küçük eklemeler.

import { register } from './index.mjs'
import { C, cel, ellipsePath, f, line, shade, silhouette, smoothPath, starPath, svg } from '../lib/svg.mjs'
import { tulipGlass } from './icons.mjs'

function tulipMotif(cx, cy, size, rot) {
  const h = size
  return `<g transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})">
    <path d="M${cx} ${f(cy + h * 0.5)} L${cx} ${f(cy - h * 0.1)}" stroke="#FFFFFF" stroke-width="${f(h * 0.08)}"/>
    <path d="M${f(cx - h * 0.3)} ${f(cy - h * 0.05)} q${f(h * 0.05)} ${f(-h * 0.45)} ${f(h * 0.3)} ${f(-h * 0.5)} q${f(h * 0.25)} ${f(h * 0.05)} ${f(h * 0.3)} ${f(h * 0.5)} q${f(-h * 0.3)} ${f(h * 0.2)} ${f(-h * 0.6)} 0Z" fill="#FFFFFF"/>
    <path d="M${f(cx - h * 0.12)} ${f(cy - h * 0.48)} l${f(h * 0.12)} ${f(-h * 0.24)} l${f(h * 0.12)} ${f(h * 0.24)}Z" fill="#FFFFFF"/>
    <path d="M${cx} ${f(cy + h * 0.3)} q${f(-h * 0.35)} ${f(-h * 0.05)} ${f(-h * 0.4)} ${f(-h * 0.3)} q${f(h * 0.3)} 0 ${f(h * 0.4)} ${f(h * 0.3)}Z" fill="${C.turq}"/>
    <path d="M${cx} ${f(cy + h * 0.3)} q${f(h * 0.35)} ${f(-h * 0.05)} ${f(h * 0.4)} ${f(-h * 0.3)} q${f(-h * 0.3)} 0 ${f(-h * 0.4)} ${f(h * 0.3)}Z" fill="${C.turq}"/>
  </g>`
}

export function medallion(cx, cy, R, theme) {
  let s = ''
  if (theme === 'yaz') {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      const r1 = R + 10
      const r2 = R + (i % 2 ? 70 : 110)
      const w = 0.09
      s += `<path d="M${f(cx + Math.cos(a - w) * r1)} ${f(cy + Math.sin(a - w) * r1)} L${f(cx + Math.cos(a) * r2)} ${f(cy + Math.sin(a) * r2)} L${f(cx + Math.cos(a + w) * r1)} ${f(cy + Math.sin(a + w) * r1)}Z" fill="#F6C445" stroke="${C.out}" stroke-width="8" stroke-linejoin="round"/>`
    }
  }
  const outer = ellipsePath(cx, cy, R, R)
  s += silhouette([outer], 22)
  s += cel(outer, '#D9A82C', { sw: 12, hl: [cx - R * 0.5, cy - R * 0.6, R * 0.3, R * 0.14], hlOpacity: 0.5 })
  const band = R - 34
  const motifs = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2
    const r = band - 52
    return tulipMotif(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 64, (a * 180) / Math.PI + 90)
  }).join('')
  s += cel(ellipsePath(cx, cy, band, band), C.cobalt, {
    sw: 9,
    off: [-16, -16],
    shadow: 0.82,
    inner: motifs + `<circle cx="${cx}" cy="${cy}" r="${band - 110}" fill="${C.turq}" stroke="${C.out}" stroke-width="8"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${band - 122}" fill="#E9F5F2"/>` +
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return `<path d="${starPath(cx + Math.cos(a) * (band - 170), cy + Math.sin(a) * (band - 170), 26, 10, 8)}" fill="${C.turq}" opacity=".35"/>`
      }).join(''),
  })
  if (theme === 'kis') {
    for (const [x, y, r] of [
      [cx - R * 0.62, cy - R * 0.5, 28],
      [cx + R * 0.66, cy - R * 0.42, 22],
      [cx - R * 0.74, cy + R * 0.2, 18],
      [cx + R * 0.72, cy + R * 0.3, 26],
      [cx + R * 0.2, cy - R * 0.8, 18],
    ]) {
      s += `<path d="${starPath(x, y, r, r * 0.35, 6)}" fill="#fff" stroke="${C.out}" stroke-width="5" stroke-linejoin="round"/>`
    }
  }
  if (theme === 'halloween') {
    for (const [x, y, sc, rot] of [
      [cx - R * 0.6, cy - R * 0.55, 1.1, -12],
      [cx + R * 0.62, cy - R * 0.5, 0.9, 14],
      [cx + R * 0.1, cy - R * 0.82, 0.7, 4],
    ]) {
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${sc})"><path d="M0 4 C-10 -14 -34 -20 -58 -12 C-48 -4 -46 6 -50 16 C-38 12 -28 16 -26 26 C-16 18 -8 18 0 24 C8 18 16 18 26 26 C28 16 38 12 50 16 C46 6 48 -4 58 -12 C34 -20 10 -14 0 4Z" fill="#3A2459" stroke="${C.out}" stroke-width="6" stroke-linejoin="round"/><circle cx="-6" cy="6" r="3.5" fill="#F6C445"/><circle cx="6" cy="6" r="3.5" fill="#F6C445"/></g>`
    }
  }
  return s
}

function steam(cx, topY, h) {
  return [
    `M${cx - 30} ${topY} C${cx - 70} ${topY - h * 0.3} ${cx + 10} ${topY - h * 0.5} ${cx - 34} ${topY - h * 0.85}`,
    `M${cx + 40} ${topY + 10} C${cx + 6} ${topY - h * 0.25} ${cx + 80} ${topY - h * 0.5} ${cx + 40} ${topY - h * 0.8}`,
  ]
    .map((d) => line(d, 34, C.out, 'opacity=".9"') + line(d, 20, '#FFFFFF', 'opacity=".95"'))
    .join('')
}

function lemonSlice(cx, cy, r) {
  let segs = ''
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    segs += `<path d="M${cx} ${cy} L${f(cx + Math.cos(a) * r * 0.78)} ${f(cy + Math.sin(a) * r * 0.78)}" stroke="#FFFBEA" stroke-width="6"/>`
  }
  return cel(ellipsePath(cx, cy, r, r), '#F6C445', { sw: 8, inner: `<circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="#FFE47A"/>${segs}` })
}

function pumpkin(cx, cy, r) {
  const body = smoothPath([[cx, cy - r * 0.8], [cx + r, cy - r * 0.5], [cx + r * 1.1, cy + r * 0.2], [cx + r * 0.7, cy + r * 0.8], [cx, cy + r * 0.85], [cx - r * 0.7, cy + r * 0.8], [cx - r * 1.1, cy + r * 0.2], [cx - r, cy - r * 0.5]])
  return (
    cel(`M${cx - 8} ${cy - r * 0.7} q4 -${r * 0.5} 22 -${r * 0.56} l4 12 q-12 6 -14 ${r * 0.44}Z`, '#4E9A3A', { sw: 6 }) +
    cel(body, '#F07C1E', { sw: 8, hl: [cx - r * 0.4, cy - r * 0.3, r * 0.2, r * 0.12], inner: `<path d="M${cx} ${cy - r * 0.8} Q${cx - r * 0.3} ${cy} ${cx} ${cy + r * 0.85} M${cx} ${cy - r * 0.8} Q${cx + r * 0.3} ${cy} ${cx} ${cy + r * 0.85}" stroke="#C25A12" stroke-width="6" fill="none"/>` }) +
    `<path d="M${cx - r * 0.45} ${cy - r * 0.1} l${r * 0.18} -${r * 0.2} l${r * 0.14} ${r * 0.2}Z M${cx + r * 0.15} ${cy - r * 0.1} l${r * 0.16} -${r * 0.2} l${r * 0.14} ${r * 0.2}Z" fill="#3B2416"/>` +
    `<path d="M${cx - r * 0.4} ${cy + r * 0.25} q${r * 0.4} ${r * 0.3} ${r * 0.8} 0 q-${r * 0.4} ${r * 0.12} -${r * 0.8} 0Z" fill="#3B2416"/>`
  )
}

export function emblem(theme) {
  const cx = 512
  let s = medallion(cx, 470, 400, theme)
  // Tabak
  const sy = 830
  s += silhouette([ellipsePath(cx, sy, 270, 70)], 20)
  s += cel(ellipsePath(cx, sy, 270, 70), '#FBFBF8', { sw: 12, off: [-10, -6], hl: [cx - 120, sy - 18, 80, 14], inner: `<path d="${ellipsePath(cx, sy + 4, 160, 40)}" fill="#ECEFF2"/>` })
  s += `<path d="${ellipsePath(cx, sy, 250, 62)}" fill="none" stroke="${C.gold}" stroke-width="8"/>`
  // Bardak
  s += `<g>${tulipGlass(cx, sy + 6, 470, { saucer: false })}</g>`
  s += steam(cx, 330, 260)
  if (theme === 'kis') {
    s += cel(smoothPath([[cx + 120, sy - 10], [cx + 170, sy - 50], [cx + 230, sy - 40], [cx + 270, sy - 6], [cx + 200, sy + 20]]), '#FFFFFF', { sw: 9, hl: [cx + 180, sy - 34, 20, 8] })
    s += cel(smoothPath([[cx - 270, sy - 6], [cx - 230, sy - 40], [cx - 180, sy - 34], [cx - 140, sy - 6], [cx - 200, sy + 22]]), '#FFFFFF', { sw: 9 })
  }
  if (theme === 'yaz') s += lemonSlice(cx + 210, sy - 50, 70)
  if (theme === 'halloween') s += pumpkin(cx + 230, sy - 60, 76)
  return svg(1024, 1024, s)
}

register(
  (id) => id === 'logo_emblem',
  (a, ctx) => emblem(ctx.theme),
)

export { shade }
