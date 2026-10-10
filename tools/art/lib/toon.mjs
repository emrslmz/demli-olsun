// v2 "parlak cartoon" stil yardımcıları.
// Kalın koyu kontur + yumuşak gradyan gövde + alt-sağda cel gölge bandı + sol üst kenarda ışık çizgisi
// + keskin beyaz parlama lekeleri + yere düşen yumuşak gölge. Işık sol üstten.

import { C, f, mix, newId, shade } from './svg.mjs'

/** Doğrusal gradyan tanımı. stops: [[offset, color, opacity?], ...]. Dönüş: [id, defString]. */
export function lg(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, units = 'objectBoundingBox') {
  const id = newId('lg')
  const st = stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')
  return [id, `<linearGradient id="${id}" gradientUnits="${units}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${st}</linearGradient>`]
}

/** Dairesel gradyan. cx, cy, r: objectBoundingBox oranları. */
export function rg(stops, cx = 0.35, cy = 0.3, r = 0.8, fx, fy) {
  const id = newId('rg')
  const st = stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')
  const fxy = fx !== undefined ? ` fx="${fx}" fy="${fy}"` : ''
  return [id, `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fxy}>${st}</radialGradient>`]
}

/**
 * Parlak cartoon gövde.
 * opts:
 *  sw       kontur kalınlığı (0: yok)
 *  stroke   kontur rengi
 *  light    üst ton açıklığı (1.0 = yok, 1.25 = belirgin)
 *  dark     alt ton koyuluğu (0.8)
 *  dir      'v' dikey, 'd' çapraz gradyan
 *  band     cel gölge bandı kayması [dx, dy] (null: yok)
 *  bandTone gölge bandı tonu çarpanı
 *  rim      sol üst kenar ışık çizgisi (true/false)
 *  spec     keskin parlamalar: [[cx, cy, rx, ry, rotDeg, opacity], ...]
 *  glow     yumuşak parıltı: [cx, cy, r, opacity]
 *  ao       alt iç gölge yüksekliği (px, 0: yok)
 *  inner    şekle kırpılmış ek içerik (desen vb.)
 */
export function toon(d, color, opts = {}) {
  const {
    sw = 6,
    stroke = C.out,
    light = 1.22,
    dark = 0.82,
    dir = 'd',
    band = [9, 9],
    bandTone = 0.84,
    rim = true,
    spec = [],
    glow = null,
    ao = 0,
    inner = '',
    fillRule,
    rimOpacity = 0.55,
  } = opts
  const fr = fillRule ? ` fill-rule="${fillRule}" clip-rule="${fillRule}"` : ''
  const [gid, gdef] =
    dir === 'v'
      ? lg([
          [0, shade(color, light)],
          [0.55, color],
          [1, shade(color, dark)],
        ])
      : lg(
          [
            [0, shade(color, light)],
            [0.5, color],
            [1, shade(color, dark)],
          ],
          0.1,
          0,
          0.7,
          1,
        )
  const cid = newId('tc')
  let s = gdef + `<clipPath id="${cid}"><path d="${d}"${fr}/></clipPath>`
  if (band) {
    s += `<path d="${d}" fill="${shade(color, bandTone * dark)}"${fr}/>`
    s += `<g clip-path="url(#${cid})"><path d="${d}" fill="url(#${gid})" transform="translate(${-band[0]} ${-band[1]})"${fr}/></g>`
  } else {
    s += `<path d="${d}" fill="url(#${gid})"${fr}/>`
  }
  s += `<g clip-path="url(#${cid})">`
  s += inner
  if (ao > 0) s += `<path d="${d}" fill="none" stroke="${shade(color, 0.55)}" stroke-width="${ao}" opacity=".35" filter="url(#b8)" transform="translate(0 ${ao * 0.35})"${fr}/>`
  if (rim) {
    const rimW = Math.max(3, sw * 0.9)
    s += `<path d="${d}" fill="none" stroke="${mix(color, '#FFFFFF', 0.75)}" stroke-width="${rimW}" opacity="${rimOpacity}" transform="translate(${rimW * 0.9} ${rimW * 0.9})" filter="url(#b2)"${fr}/>`
  }
  if (glow) s += `<circle cx="${f(glow[0])}" cy="${f(glow[1])}" r="${f(glow[2])}" fill="#fff" opacity="${glow[3] ?? 0.45}" filter="url(#b14)"/>`
  for (const [cx, cy, rx, ry, rot = 0, op = 0.85] of spec) {
    s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${rot} ${f(cx)} ${f(cy)})" fill="#fff" opacity="${op}"/>`
  }
  s += `</g>`
  if (sw > 0) s += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${fr}/>`
  return s
}

/** Yere düşen yumuşak gölge. */
export function contactShadow(cx, cy, rx, ry, opacity = 0.35, color = '#2A1408') {
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${color}" opacity="${opacity}" filter="url(#b8)"/>`
}

/** Keskin beyaz "hap" parlama (kavisli şekillerde). */
export function pill(x1, y1, x2, y2, w, opacity = 0.85) {
  return `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="#fff" stroke-width="${f(w)}" stroke-linecap="round" opacity="${opacity}"/>`
}

/** Yay parlama: bir eğri boyunca keskin beyaz çizgi. */
export function arcShine(d, w, opacity = 0.8) {
  return `<path d="${d}" fill="none" stroke="#fff" stroke-width="${f(w)}" stroke-linecap="round" opacity="${opacity}"/>`
}

export { C, f, mix, shade }
