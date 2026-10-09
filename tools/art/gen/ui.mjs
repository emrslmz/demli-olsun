// Arayüz (saydam): kara tahta (NineSlice), tahtaya iğnelenmiş kâğıt fiş, menü paneli (NineSlice).
// Köşe süsü yok: kod bu görselleri esnetecek.

import { register } from './index.mjs'
import { C, ellipsePath, f, rng, rrectPath, shade, svg } from '../lib/svg.mjs'

const WOOD = '#8A5A33'

function woodGrain(x, y, w, h, horizontal, seed) {
  const r = rng(seed)
  let s = ''
  const n = horizontal ? Math.floor(h / 7) : Math.floor(w / 7)
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    const op = 0.12 + r() * 0.18
    if (horizontal) {
      const yy = y + t * h
      s += `<path d="M${x} ${f(yy)} Q${f(x + w * 0.3)} ${f(yy + (r() - 0.5) * 6)} ${f(x + w * 0.6)} ${f(yy + (r() - 0.5) * 4)} T${x + w} ${f(yy)}" stroke="#4A2C16" stroke-width="${f(1 + r() * 2)}" opacity="${f(op)}" fill="none"/>`
    } else {
      const xx = x + t * w
      s += `<path d="M${f(xx)} ${y} Q${f(xx + (r() - 0.5) * 6)} ${f(y + h * 0.3)} ${f(xx + (r() - 0.5) * 4)} ${f(y + h * 0.6)} T${f(xx)} ${y + h}" stroke="#4A2C16" stroke-width="${f(1 + r() * 2)}" opacity="${f(op)}" fill="none"/>`
    }
  }
  return s
}

/** Eşit kalınlıkta ahşap çerçeve (gönye birleşimli), iç kısım ayrı çizilir. */
function frame(W, H, t, m, wood = WOOD) {
  const ox = m
  const oy = m
  const w = W - 2 * m
  const h = H - 2 * m
  const top = `M${ox} ${oy} L${ox + w} ${oy} L${ox + w - t} ${oy + t} L${ox + t} ${oy + t}Z`
  const bottom = `M${ox} ${oy + h} L${ox + w} ${oy + h} L${ox + w - t} ${oy + h - t} L${ox + t} ${oy + h - t}Z`
  const left = `M${ox} ${oy} L${ox + t} ${oy + t} L${ox + t} ${oy + h - t} L${ox} ${oy + h}Z`
  const right = `M${ox + w} ${oy} L${ox + w - t} ${oy + t} L${ox + w - t} ${oy + h - t} L${ox + w} ${oy + h}Z`
  let s = ''
  s += `<path d="${top}" fill="${shade(wood, 1.12)}"/>` + `<g clip-path="url(#ft)">${woodGrain(ox, oy, w, t, true, 'top')}</g>`
  s += `<path d="${bottom}" fill="${shade(wood, 0.85)}"/>` + `<g clip-path="url(#fb)">${woodGrain(ox, oy + h - t, w, t, true, 'bot')}</g>`
  s += `<path d="${left}" fill="${wood}"/>` + `<g clip-path="url(#fl)">${woodGrain(ox, oy, t, h, false, 'left')}</g>`
  s += `<path d="${right}" fill="${shade(wood, 0.92)}"/>` + `<g clip-path="url(#fr)">${woodGrain(ox + w - t, oy, t, h, false, 'right')}</g>`
  // Üst kenar ışığı ve iç gölge
  s += `<path d="M${ox + 6} ${oy + 6} L${ox + w - 6} ${oy + 6}" stroke="#E9B98A" stroke-width="5" opacity=".55"/>`
  s += `<path d="M${ox + t} ${oy + t} L${ox + t} ${oy + h - t} L${ox + w - t} ${oy + h - t}" stroke="#2A1608" stroke-width="3" opacity=".35" fill="none"/>`
  // Gönye çizgileri
  s += `<path d="M${ox} ${oy} L${ox + t} ${oy + t} M${ox + w} ${oy} L${ox + w - t} ${oy + t} M${ox} ${oy + h} L${ox + t} ${oy + h - t} M${ox + w} ${oy + h} L${ox + w - t} ${oy + h - t}" stroke="${C.out}" stroke-width="4" opacity=".7"/>`
  s += `<path d="${rrectPath(ox, oy, w, h, 6)}" fill="none" stroke="${C.out}" stroke-width="8"/>`
  s += `<path d="${rrectPath(ox + t, oy + t, w - 2 * t, h - 2 * t, 2)}" fill="none" stroke="${C.out}" stroke-width="5"/>`
  const defs = `<clipPath id="ft"><path d="${top}"/></clipPath><clipPath id="fb"><path d="${bottom}"/></clipPath><clipPath id="fl"><path d="${left}"/></clipPath><clipPath id="fr"><path d="${right}"/></clipPath>`
  return { s, defs }
}

function board() {
  const W = 1536
  const H = 640
  const m = 6
  const t = 42
  const r = rng('board')
  let inner = `<rect x="${m + t}" y="${m + t}" width="${W - 2 * (m + t)}" height="${H - 2 * (m + t)}" fill="${C.board}"/>`
  // Tebeşir tozu: yumuşak lekeler ve silinmiş izler
  for (let i = 0; i < 26; i++) {
    const x = m + t + 40 + r() * (W - 2 * (m + t) - 80)
    const y = m + t + 30 + r() * (H - 2 * (m + t) - 60)
    inner += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(40 + r() * 120)}" ry="${f(14 + r() * 40)}" fill="#EDEDE4" opacity="${f(0.025 + r() * 0.045)}" filter="url(#b14)"/>`
  }
  for (let i = 0; i < 10; i++) {
    const x = m + t + 60 + r() * (W - 2 * (m + t) - 300)
    const y = m + t + 40 + r() * (H - 2 * (m + t) - 80)
    inner += `<path d="M${f(x)} ${f(y)} q${f(80 + r() * 120)} ${f((r() - 0.5) * 30)} ${f(200 + r() * 100)} ${f((r() - 0.5) * 20)}" stroke="#EDEDE4" stroke-width="${f(10 + r() * 16)}" opacity="${f(0.03 + r() * 0.03)}" fill="none" filter="url(#b4)" stroke-linecap="round"/>`
  }
  // Alt kenarda tebeşir birikintisi
  inner += `<rect x="${m + t}" y="${H - m - t - 14}" width="${W - 2 * (m + t)}" height="14" fill="#EDEDE4" opacity=".05" filter="url(#b4)"/>`
  const fr = frame(W, H, t, m)
  return svg(W, H, inner + fr.s, fr.defs)
}

function card() {
  const W = 512
  const H = 640
  const r = rng('card')
  // Hafif düzensiz kenarlı kâğıt
  const pts = []
  const L = 30
  const T = 40
  const R = W - 30
  const B = H - 26
  const jag = (a, b, n, fixed, horiz) => {
    for (let i = 0; i <= n; i++) {
      const v = a + ((b - a) * i) / n
      const j = (r() - 0.5) * 5
      pts.push(horiz ? [v, fixed + j] : [fixed + j, v])
    }
  }
  jag(L, R, 18, T, true)
  jag(T, B, 22, R, false)
  jag(R, L, 18, B, true)
  jag(B, T, 22, L, false)
  const paper = 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z'
  let s = `<path d="${paper}" fill="#000" opacity=".25" transform="translate(8 10)" filter="url(#b4)"/>`
  s += `<clipPath id="pc"><path d="${paper}"/></clipPath>`
  s += `<path d="${paper}" fill="${C.paper}"/>`
  s += `<g clip-path="url(#pc)">`
  // Yaşlanma lekeleri ve kenar sararması
  for (let i = 0; i < 9; i++) {
    s += `<circle cx="${f(L + r() * (R - L))}" cy="${f(T + r() * (B - T))}" r="${f(20 + r() * 50)}" fill="#C9A86A" opacity="${f(0.05 + r() * 0.06)}" filter="url(#b14)"/>`
  }
  s += `<path d="${paper}" fill="none" stroke="#D9BE84" stroke-width="22" opacity=".5" filter="url(#b8)"/>`
  // Sağ alt köşede hafif kıvrılma gölgesi
  s += `<path d="M${R - 70} ${B} Q${R - 10} ${B - 10} ${R} ${B - 70} L${R} ${B}Z" fill="#B89A5E" opacity=".25" filter="url(#b4)"/>`
  s += `</g>`
  s += `<path d="${paper}" fill="none" stroke="${C.out}" stroke-width="5" stroke-linejoin="round"/>`
  // Raptiye
  const px = W / 2
  const py = 44
  s += `<ellipse cx="${px + 6}" cy="${py + 10}" rx="22" ry="10" fill="#000" opacity=".3" filter="url(#b4)"/>`
  s += `<circle cx="${px}" cy="${py}" r="22" fill="#C0392B" stroke="${C.out}" stroke-width="5"/>`
  s += `<circle cx="${px - 2}" cy="${py - 2}" r="12" fill="#E35D4F"/>`
  s += `<ellipse cx="${px - 7}" cy="${py - 8}" rx="6" ry="4" fill="#fff" opacity=".8"/>`
  return svg(W, H, s)
}

function panel() {
  const W = 1024
  const H = 1024
  const m = 6
  const t = 58
  const r = rng('panel')
  let inner = `<rect x="${m + t}" y="${m + t}" width="${W - 2 * (m + t)}" height="${H - 2 * (m + t)}" fill="${C.cream}"/>`
  for (let i = 0; i < 18; i++) {
    inner += `<circle cx="${f(m + t + r() * (W - 2 * (m + t)))}" cy="${f(m + t + r() * (H - 2 * (m + t)))}" r="${f(40 + r() * 90)}" fill="#D9BE84" opacity="${f(0.04 + r() * 0.05)}" filter="url(#b24)"/>`
  }
  inner += `<rect x="${m + t}" y="${m + t}" width="${W - 2 * (m + t)}" height="${H - 2 * (m + t)}" fill="none" stroke="#C9A86A" stroke-width="18" opacity=".35" filter="url(#b8)"/>`
  const fr = frame(W, H, t, m, '#9A6537')
  return svg(W, H, inner + fr.s, fr.defs)
}

register((id) => id === 'ui_board', () => board())
register((id) => id === 'ui_card', () => card())
register((id) => id === 'ui_panel', () => panel())

export { ellipsePath }
