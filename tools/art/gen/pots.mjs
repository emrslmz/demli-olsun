// Demlik takımları: tüm ağızlar SAĞA bakar. Demlik küçük ve tombul, çaydanlık daha büyük ve uzun gövdeli.
// Yandan ve ~15° yukarıdan görünüm. Çapalar (pivot, spout) çizimin geometrisinden hesaplanır.

import { register } from './index.mjs'
import { C, ellipsePath, f, line, mix, newId, shade, silhouette, smoothPath, svg } from '../lib/svg.mjs'
import { contactShadow, toon } from '../lib/toon.mjs'

/** v2: eski cel() çağrılarını parlak toon gövdeye çevirir (keskin parlama + kenar ışığı). */
function cel(d, fill, o = {}) {
  const spec = o.hl ? [[o.hl[0], o.hl[1], o.hl[2] * 0.75, o.hl[3] * 0.6, 0, Math.min(0.95, (o.hlOpacity ?? 0.4) + 0.35)]] : []
  const glow = o.hl ? [o.hl[0], o.hl[1], Math.max(o.hl[2], o.hl[3]) * 1.4, 0.35] : null
  return toon(d, fill, {
    sw: o.sw ?? 6,
    band: o.noShadow ? null : o.off ?? [10, 10],
    bandTone: o.shadow ? Math.min(1, o.shadow + 0.12) : 0.9,
    light: 1.25,
    dark: 0.78,
    spec,
    glow,
    inner: o.inner ?? '',
  })
}

const MATERIALS = {
  celik: { body: '#BCC6D0', dark: '#6F7C89', light: '#FFFFFF', handle: '#2A2F36', knob: '#2A2F36', rim: '#98A3AE' },
  emaye: { body: '#F2E6CC', dark: '#D9C7A2', light: '#FFF9EC', handle: '#1F4E8C', knob: '#1F4E8C', rim: '#1F4E8C' },
  porselen: { body: '#FAFAF6', dark: '#D8DEE6', light: '#FFFFFF', handle: '#FAFAF6', knob: '#1F4E8C', rim: '#1F4E8C' },
  bakir: { body: '#C77A45', dark: '#94522A', light: '#F3B587', handle: '#C9A227', knob: '#C9A227', rim: '#A85E31' },
}

/** Kübik Bezier boyunca incelen boru (ağız). */
function tube(p0, p1, p2, p3, w0, w1, steps = 24) {
  const pt = (t) => {
    const u = 1 - t
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]
  }
  const left = []
  const right = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = pt(Math.max(0, t - 0.01))
    const b = pt(Math.min(1, t + 0.01))
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    const nx = -dy / l
    const ny = dx / l
    const w = (w0 + (w1 - w0) * t) / 2
    const p = pt(t)
    left.push([p[0] + nx * w, p[1] + ny * w])
    right.push([p[0] - nx * w, p[1] - ny * w])
  }
  const d = 'M' + left.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'L' + right.reverse().map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z'
  return { d, tip: pt(1), tipDir: (() => { const a = pt(0.97); const b = pt(1); return [b[0] - a[0], b[1] - a[1]] })() }
}

function flowers(cx, cy, rx, ry, seed = 1) {
  let s = ''
  const spots = [
    [-0.45, -0.1, 1],
    [0.1, 0.15, 1.2],
    [0.55, -0.15, 0.9],
    [-0.15, -0.5, 0.7],
    [0.3, -0.55, 0.65],
    [-0.6, 0.35, 0.75],
  ]
  for (const [dx, dy, sc] of spots) {
    const x = cx + dx * rx
    const y = cy + dy * ry
    const r = 26 * sc
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + seed
      s += `<ellipse cx="${f(x + Math.cos(a) * r * 0.6)}" cy="${f(y + Math.sin(a) * r * 0.6)}" rx="${f(r * 0.5)}" ry="${f(r * 0.34)}" transform="rotate(${f((a * 180) / Math.PI)} ${f(x + Math.cos(a) * r * 0.6)} ${f(y + Math.sin(a) * r * 0.6)})" fill="#C0392B" stroke="${C.out}" stroke-width="3"/>`
    }
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.26)}" fill="#F6C445" stroke="${C.out}" stroke-width="3"/>`
    s += `<path d="M${f(x + r * 0.7)} ${f(y + r * 0.6)} q${f(r * 0.6)} ${f(r * 0.1)} ${f(r * 0.9)} ${f(r * 0.6)} q${f(-r * 0.6)} ${f(r * 0.1)} ${f(-r * 0.9)} ${f(-r * 0.6)}Z" fill="#1F4E8C" stroke="${C.out}" stroke-width="3"/>`
  }
  return s
}

function tulips(cx, cy, rx, ry) {
  let s = ''
  const spots = [
    [-0.4, 0, 1],
    [0.2, 0.1, 1.1],
    [0.62, -0.1, 0.8],
    [-0.1, -0.5, 0.65],
  ]
  for (const [dx, dy, sc] of spots) {
    const x = cx + dx * rx
    const y = cy + dy * ry
    const h = 64 * sc
    s += `<path d="M${f(x)} ${f(y + h * 0.6)} q${f(-h * 0.1)} ${f(-h * 0.5)} 0 ${f(-h * 0.9)}" stroke="#1F4E8C" stroke-width="5" fill="none"/>`
    s += `<path d="M${f(x)} ${f(y + h * 0.2)} q${f(-h * 0.5)} ${f(-h * 0.1)} ${f(-h * 0.5)} ${f(-h * 0.5)} q${f(h * 0.4)} ${f(h * 0.05)} ${f(h * 0.5)} ${f(h * 0.5)}Z" fill="#1F4E8C"/>`
    s += `<path d="M${f(x - h * 0.28)} ${f(y - h * 0.3)} q${f(h * 0.06)} ${f(-h * 0.4)} ${f(h * 0.28)} ${f(-h * 0.5)} q${f(h * 0.22)} ${f(h * 0.1)} ${f(h * 0.28)} ${f(h * 0.5)} q${f(-h * 0.28)} ${f(h * 0.18)} ${f(-h * 0.56)} 0Z" fill="#1F4E8C" stroke="#163A69" stroke-width="2"/>`
    s += `<path d="M${f(x - h * 0.08)} ${f(y - h * 0.62)} l${f(h * 0.08)} ${f(-h * 0.22)} l${f(h * 0.08)} ${f(h * 0.22)}" fill="#1E9AA8"/>`
  }
  return s
}

function hammered(cx, cy, rx, ry, m) {
  let s = ''
  let k = 0
  for (let y = -0.9; y <= 0.9; y += 0.22) {
    for (let x = -0.9; x <= 0.9; x += 0.2) {
      k++
      const ox = (k % 2) * 0.1
      const px = cx + (x + ox) * rx
      const py = cy + y * ry
      s += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="14" ry="10" fill="${k % 3 ? m.light : m.dark}" opacity="${k % 3 ? 0.28 : 0.22}"/>`
    }
  }
  return s
}

function reflections(cx, top, bottom, rx, m) {
  // Çelik/bakır: dikey yansıma bantları
  return `<rect x="${f(cx - rx * 0.62)}" y="${top}" width="${f(rx * 0.16)}" height="${bottom - top}" fill="${m.light}" opacity=".7"/>
    <rect x="${f(cx - rx * 0.38)}" y="${top}" width="${f(rx * 0.06)}" height="${bottom - top}" fill="${m.light}" opacity=".55"/>
    <rect x="${f(cx + rx * 0.42)}" y="${top}" width="${f(rx * 0.22)}" height="${bottom - top}" fill="${m.dark}" opacity=".35"/>`
}

function decor(mat, cx, cy, rx, ry) {
  const m = MATERIALS[mat]
  if (mat === 'emaye') return flowers(cx, cy, rx, ry)
  if (mat === 'porselen') return tulips(cx, cy, rx, ry)
  if (mat === 'bakir') return hammered(cx, cy, rx, ry, m) + reflections(cx, cy - ry, cy + ry, rx, m)
  return reflections(cx, cy - ry, cy + ry, rx, m)
}

function handleShape(x0, yA, yB, reach, thick) {
  return `M${x0} ${yA - thick / 2} C${x0 - reach * 1.25} ${yA - thick * 1.4} ${x0 - reach * 1.3} ${yB + thick} ${x0} ${yB + thick / 2} L${x0} ${yB - thick / 2} C${x0 - reach * 0.78} ${yB} ${x0 - reach * 0.74} ${yA} ${x0} ${yA + thick / 2}Z`
}

function pot(kind, mat) {
  const m = MATERIALS[mat]
  const isDemlik = kind === 'demlik'
  const W = 768
  const H = isDemlik ? 620 : 768
  // Gövde
  const cx = isDemlik ? 360 : 352
  const bodyTop = isDemlik ? 236 : 236
  const bodyBot = isDemlik ? 548 : 700
  const rx = isDemlik ? 196 : 178
  const neckR = isDemlik ? 118 : 104
  const bodyPts = isDemlik
    ? [
        [cx - neckR, bodyTop],
        [cx - rx * 0.86, bodyTop + 50],
        [cx - rx, bodyTop + 150],
        [cx - rx * 0.92, bodyBot - 70],
        [cx - rx * 0.66, bodyBot - 8],
        [cx, bodyBot + 4],
        [cx + rx * 0.66, bodyBot - 8],
        [cx + rx * 0.92, bodyBot - 70],
        [cx + rx, bodyTop + 150],
        [cx + rx * 0.86, bodyTop + 50],
        [cx + neckR, bodyTop],
      ]
    : [
        [cx - neckR, bodyTop],
        [cx - rx * 0.78, bodyTop + 70],
        [cx - rx * 0.94, bodyTop + 220],
        [cx - rx, bodyBot - 90],
        [cx - rx * 0.8, bodyBot - 10],
        [cx, bodyBot + 4],
        [cx + rx * 0.8, bodyBot - 10],
        [cx + rx, bodyBot - 90],
        [cx + rx * 0.94, bodyTop + 220],
        [cx + rx * 0.78, bodyTop + 70],
        [cx + neckR, bodyTop],
      ]
  const body = smoothPath(bodyPts, true, 0.55)
  const bodyMidY = isDemlik ? 400 : 480
  // Ağız
  const sp = isDemlik
    ? tube([cx + rx * 0.82, 430], [cx + rx + 70, 420], [cx + rx + 110, 330], [736, 226], 92, 30)
    : tube([cx + rx * 0.84, 600], [cx + rx + 90, 590], [cx + rx + 120, 420], [738, 296], 100, 32)
  const tipOpening = ellipsePath(sp.tip[0] - 2, sp.tip[1] + 2, 20, 9)
  // Kulp (solda)
  const handle = isDemlik ? handleShape(cx - rx * 0.86, 300, 470, 120, 40) : handleShape(cx - rx * 0.9, 330, 600, 130, 44)
  // Kapak
  const lidY = bodyTop
  const lidRx = neckR + 10
  const lid = `M${cx - lidRx} ${lidY} C${cx - lidRx + 8} ${lidY - 70} ${cx + lidRx - 8} ${lidY - 70} ${cx + lidRx} ${lidY} Q${cx} ${lidY + 22} ${cx - lidRx} ${lidY}Z`
  const rimRing = ellipsePath(cx, lidY + 4, lidRx + 12, 22)
  const knobY = lidY - 74
  const knob = isDemlik ? ellipsePath(cx, knobY, 30, 26) : ellipsePath(cx, knobY, 26, 22)
  const knobStem = `M${cx - 14} ${knobY + 14} L${cx + 14} ${knobY + 14} L${cx + 18} ${lidY - 42} L${cx - 18} ${lidY - 42}Z`
  // Taban halkası
  const foot = `M${cx - rx * 0.6} ${bodyBot - 14} Q${cx} ${bodyBot + 30} ${cx + rx * 0.6} ${bodyBot - 14} L${cx + rx * 0.56} ${bodyBot + 12} Q${cx} ${bodyBot + 44} ${cx - rx * 0.56} ${bodyBot + 12}Z`

  let s = contactShadow(cx, bodyBot + 20, rx * 0.95, 26, 0.3) + silhouette([body, sp.d, handle, lid, knob, foot], 18)
  s += cel(handle, m.handle, { sw: 7, hl: [cx - rx - 70, isDemlik ? 330 : 380, 18, 30], hlOpacity: 0.3 })
  s += cel(sp.d, m.body, { sw: 7, shadow: 0.78, off: [0, 10], hl: [cx + rx + 50, isDemlik ? 380 : 520, 30, 12], inner: mat === 'emaye' || mat === 'porselen' ? '' : `<path d="${sp.d}" fill="none" stroke="${m.light}" stroke-width="10" opacity=".35" transform="translate(-6 -6)"/>` })
  s += `<path d="${tipOpening}" fill="${mat === 'celik' ? '#4E5863' : m.rim}" stroke="${C.out}" stroke-width="5"/>`
  s += cel(foot, shade(m.body, 0.82), { sw: 6 })
  s += cel(body, m.body, {
    sw: 8,
    shadow: 0.78,
    off: [22, 14],
    hl: [cx - rx * 0.45, bodyTop + 80, rx * 0.28, 50],
    hlOpacity: 0.55,
    inner: decor(mat, cx, bodyMidY, rx * 0.86, (bodyBot - bodyTop) * 0.36),
  })
  // Gövde-boyun bandı (emaye/porselen: mavi kenar)
  if (mat === 'emaye' || mat === 'porselen') {
    s += line(`M${cx - rx * 0.62} ${bodyBot - 18} Q${cx} ${bodyBot + 18} ${cx + rx * 0.62} ${bodyBot - 18}`, 10, m.rim)
  }
  s += cel(rimRing, mat === 'celik' ? m.rim : shade(m.body, 0.9), { sw: 6, noShadow: true })
  s += cel(lid, m.body, { sw: 7, hl: [cx - 40, lidY - 34, 34, 12], hlOpacity: 0.6, inner: mat === 'emaye' || mat === 'porselen' ? `<path d="M${cx - lidRx} ${lidY - 4} Q${cx} ${lidY + 18} ${cx + lidRx} ${lidY - 4}" stroke="${m.rim}" stroke-width="10" fill="none"/>` : '' })
  s += cel(knobStem, shade(m.knob, 0.9), { sw: 5, noShadow: true })
  s += cel(knob, m.knob, { sw: 6, hl: [cx - 10, knobY - 8, 9, 6], hlOpacity: 0.7 })

  const pivot = [cx / W, (bodyBot - 30) / H]
  const spout = [sp.tip[0] / W, sp.tip[1] / H]
  return { svg: svg(W, H, s), meta: { pivot: pivot.map((v) => Math.round(v * 1000) / 1000), spout: spout.map((v) => Math.round(v * 1000) / 1000) } }
}

register(
  (id) => id.startsWith('pot_'),
  (a) => {
    const [, kind, mat] = a.id.split('_')
    if (!MATERIALS[mat]) return null
    return pot(kind, mat)
  },
)

export { mix, newId }
