// Lig rozetleri (512, saydam): madalyon + kurdele. Bronz/tek bardak → … → yakut-altın/taçlı semaver.

import { register } from './index.mjs'
import { C, cel, ellipsePath, f, line, shade, silhouette, smoothPath, starPath, svg } from '../lib/svg.mjs'
import { tulipGlass } from './icons.mjs'

export function samovar(cx, baseY, h) {
  const s = h / 300
  const X = (x) => f(cx + x * s)
  const Y = (y) => f(baseY - y * s)
  const body = smoothPath(
    [
      [cx - 54 * s, baseY - 60 * s],
      [cx - 78 * s, baseY - 120 * s],
      [cx - 70 * s, baseY - 190 * s],
      [cx - 46 * s, baseY - 220 * s],
      [cx + 46 * s, baseY - 220 * s],
      [cx + 70 * s, baseY - 190 * s],
      [cx + 78 * s, baseY - 120 * s],
      [cx + 54 * s, baseY - 60 * s],
    ],
    true,
    0.5,
  )
  const neck = `M${X(-36)} ${Y(218)} L${X(36)} ${Y(218)} L${X(28)} ${Y(246)} L${X(-28)} ${Y(246)}Z`
  const crown = `M${X(-40)} ${Y(244)} Q${X(0)} ${Y(274)} ${X(40)} ${Y(244)} L${X(30)} ${Y(258)} L${X(-30)} ${Y(258)}Z`
  const chimney = `M${X(-12)} ${Y(258)} L${X(12)} ${Y(258)} L${X(10)} ${Y(296)} L${X(-10)} ${Y(296)}Z`
  const foot = `M${X(-40)} ${Y(64)} L${X(40)} ${Y(64)} L${X(58)} ${Y(14)} L${X(-58)} ${Y(14)}Z`
  const base = `M${X(-70)} ${Y(16)} L${X(70)} ${Y(16)} L${X(64)} ${Y(0)} L${X(-64)} ${Y(0)}Z`
  const tap = `M${X(20)} ${Y(96)} L${X(70)} ${Y(96)} L${X(76)} ${Y(80)} L${X(84)} ${Y(80)} L${X(84)} ${Y(60)} L${X(70)} ${Y(64)} L${X(20)} ${Y(80)}Z`
  let o = silhouette([body, neck, crown, chimney, foot, base, tap], 10 * s)
  o += line(`M${X(-76)} ${Y(170)} q${f(-30 * s)} ${f(-6 * s)} ${f(-26 * s)} ${f(30 * s)}`, 10 * s, C.out) + line(`M${X(76)} ${Y(170)} q${f(30 * s)} ${f(-6 * s)} ${f(26 * s)} ${f(30 * s)}`, 10 * s, C.out)
  o += cel(base, '#8A5A33', { sw: 5 * s }) + cel(foot, '#C9A227', { sw: 5 * s })
  o += cel(body, '#E2B33C', { sw: 6 * s, hl: [cx - 40 * s, baseY - 170 * s, 16 * s, 34 * s], hlOpacity: 0.6, inner: `<path d="M${X(-74)} ${Y(140)} Q${X(0)} ${Y(124)} ${X(74)} ${Y(140)}" stroke="#B68A1E" stroke-width="${f(6 * s)}" fill="none"/>` })
  o += cel(tap, '#C9A227', { sw: 5 * s }) + cel(neck, '#C9A227', { sw: 5 * s }) + cel(crown, '#E2B33C', { sw: 5 * s }) + cel(chimney, '#8A5A33', { sw: 5 * s })
  return o
}

function demlikMini(cx, baseY, h) {
  const s = h / 200
  const body = smoothPath([[cx - 70 * s, baseY - 120 * s], [cx - 82 * s, baseY - 60 * s], [cx - 50 * s, baseY], [cx + 50 * s, baseY], [cx + 82 * s, baseY - 60 * s], [cx + 70 * s, baseY - 120 * s]], true, 0.5)
  const lid = `M${f(cx - 56 * s)} ${f(baseY - 118 * s)} C${f(cx - 50 * s)} ${f(baseY - 170 * s)} ${f(cx + 50 * s)} ${f(baseY - 170 * s)} ${f(cx + 56 * s)} ${f(baseY - 118 * s)}Z`
  const spout = `M${f(cx + 70 * s)} ${f(baseY - 60 * s)} C${f(cx + 110 * s)} ${f(baseY - 60 * s)} ${f(cx + 110 * s)} ${f(baseY - 110 * s)} ${f(cx + 136 * s)} ${f(baseY - 140 * s)} L${f(cx + 142 * s)} ${f(baseY - 130 * s)} C${f(cx + 126 * s)} ${f(baseY - 100 * s)} ${f(cx + 120 * s)} ${f(baseY - 34 * s)} ${f(cx + 64 * s)} ${f(baseY - 30 * s)}Z`
  let o = silhouette([body, lid, spout], 10 * s)
  o += line(`M${f(cx - 74 * s)} ${f(baseY - 100 * s)} C${f(cx - 130 * s)} ${f(baseY - 100 * s)} ${f(cx - 130 * s)} ${f(baseY - 30 * s)} ${f(cx - 70 * s)} ${f(baseY - 30 * s)}`, 16 * s, C.out)
  o += cel(spout, '#E2B33C', { sw: 6 * s }) + cel(body, '#F6C445', { sw: 7 * s, hl: [cx - 34 * s, baseY - 90 * s, 18 * s, 14 * s], hlOpacity: 0.6 }) + cel(lid, '#E2B33C', { sw: 6 * s })
  o += cel(ellipsePath(cx, baseY - 160 * s, 14 * s, 12 * s), '#E2B33C', { sw: 5 * s })
  return o
}

function laurel(cx, cy, r) {
  let o = ''
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + side * (0.35 + i * 0.27)
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r
      const rot = (a * 180) / Math.PI + (side > 0 ? -60 : 60)
      o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="22" ry="10" transform="rotate(${f(rot)} ${f(x)} ${f(y)})" fill="#4E9A3A" stroke="${C.out}" stroke-width="4"/>`
    }
  }
  return o
}

function badge(tier) {
  const cx = 256
  const cy = 236
  const R = 176
  const M = {
    mahalle: { rim: '#B8743A', inner: '#D99456', deep: '#8A5426' },
    ilce: { rim: '#A9B4BF', inner: '#CFD8E0', deep: '#7E8A96' },
    sehir: { rim: '#D9A82C', inner: '#F2C94C', deep: '#A57B12' },
    bolge: { rim: '#D9A82C', inner: C.turq, deep: '#136670' },
    turkiye: { rim: '#D9A82C', inner: '#A3122A', deep: '#6B0B1B' },
  }[tier]
  let s = ''
  // Kurdele kuyrukları
  const ribbonColor = tier === 'turkiye' ? '#C62828' : tier === 'bolge' ? C.cobalt : C.tea
  const rl = `M${cx - 96} ${cy + 120} L${cx - 140} ${cy + 250} L${cx - 96} ${cy + 226} L${cx - 70} ${cy + 268} L${cx - 30} ${cy + 140}Z`
  const rr = `M${cx + 96} ${cy + 120} L${cx + 140} ${cy + 250} L${cx + 96} ${cy + 226} L${cx + 70} ${cy + 268} L${cx + 30} ${cy + 140}Z`
  s += cel(rl, ribbonColor, { sw: 7 }) + cel(rr, shade(ribbonColor, 0.9), { sw: 7 })
  // Tırtıklı kenar
  const pts = []
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    const r = i % 2 ? R : R + 14
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  const scallop = 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z'
  s += silhouette([scallop], 14)
  s += cel(scallop, M.rim, { sw: 8, hl: [cx - 80, cy - 100, 50, 26], hlOpacity: 0.5 })
  s += cel(ellipsePath(cx, cy, R - 30, R - 30), M.inner, {
    sw: 7,
    off: [-12, -12],
    shadow: 0.85,
    inner: `<circle cx="${cx}" cy="${cy}" r="${R - 48}" fill="none" stroke="${M.deep}" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round"/>`,
  })
  if (tier === 'turkiye') s += laurel(cx, cy + 10, 118)
  // Amblem
  if (tier === 'mahalle') s += tulipGlass(cx, cy + 96, 170)
  if (tier === 'ilce') s += tulipGlass(cx - 46, cy + 96, 156) + tulipGlass(cx + 46, cy + 96, 156)
  if (tier === 'sehir') s += demlikMini(cx - 10, cy + 96, 190)
  if (tier === 'bolge') s += samovar(cx, cy + 108, 220)
  if (tier === 'turkiye') {
    s += samovar(cx, cy + 112, 200)
    // Taç
    const crown = `M${cx - 56} ${cy - 92} L${cx - 64} ${cy - 146} L${cx - 30} ${cy - 118} L${cx} ${cy - 160} L${cx + 30} ${cy - 118} L${cx + 64} ${cy - 146} L${cx + 56} ${cy - 92}Z`
    s += cel(crown, '#F6C445', { sw: 7, hl: [cx - 20, cy - 126, 14, 8], inner: `<circle cx="${cx}" cy="${cy - 106}" r="8" fill="#C62828"/><circle cx="${cx - 34}" cy="${cy - 104}" r="6" fill="${C.turq}"/><circle cx="${cx + 34}" cy="${cy - 104}" r="6" fill="${C.turq}"/>` })
  }
  // Küçük yıldızlar
  const stars = { mahalle: 1, ilce: 2, sehir: 3, bolge: 4, turkiye: 5 }[tier]
  for (let i = 0; i < stars; i++) {
    const x = cx + (i - (stars - 1) / 2) * 34
    s += `<path d="${starPath(x, cy + 140, 14, 6)}" fill="#F6C445" stroke="${C.out}" stroke-width="4"/>`
  }
  return svg(512, 512, s)
}

register(
  (id) => id.startsWith('badge_'),
  (a) => badge(a.id.replace('badge_', '')),
)
