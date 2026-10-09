// Arka planlar (opak, JPG). Dikey mobil oyun arka planı, göz hizasından düz bakış.
// Ön planda ahşap tezgâh; üst kenarı yüksekliğin %68'inde düz yatay çizgi.
// %30–%68 arası sakin ve az detaylı (oyun öğeleri orada). Üst %25'i kısmen arayüz kaplar.
// Önde insan yok, yazı/okunur tabela/logo yok.

import { register } from './index.mjs'
import { C, cel, ellipsePath, f, line, mix, rng, rrectPath, shade, smoothPath, starPath, svg } from '../lib/svg.mjs'
import { tulipGlass } from './icons.mjs'

const COUNTER = 0.68

// ---------- Ortak katmanlar ----------

function counter(W, H, opts = {}) {
  const { wood = '#5C3A21', top = '#7A4E2C', rail = true, planks = true } = opts
  const y = H * COUNTER
  const topH = H * 0.035
  const r = rng('counter' + W)
  let s = `<rect x="0" y="${f(y)}" width="${W}" height="${f(H - y)}" fill="${wood}"/>`
  // Ön panel tahtaları
  if (planks) {
    const n = Math.round(W / 180)
    for (let i = 0; i <= n; i++) {
      const x = (i * W) / n
      s += `<rect x="${f(x - 3)}" y="${f(y + topH)}" width="6" height="${f(H - y)}" fill="#3B2416" opacity=".55"/>`
      s += `<rect x="${f(x + 3)}" y="${f(y + topH)}" width="4" height="${f(H - y)}" fill="#8A5A33" opacity=".35"/>`
    }
  }
  // Damarlar
  for (let i = 0; i < 70; i++) {
    const yy = y + topH + r() * (H - y - topH)
    const x0 = r() * W
    const len = 120 + r() * 380
    s += `<path d="M${f(x0)} ${f(yy)} q${f(len / 2)} ${f((r() - 0.5) * 10)} ${f(len)} ${f((r() - 0.5) * 6)}" stroke="#2E1A0C" stroke-width="${f(1.5 + r() * 2.5)}" opacity="${f(0.12 + r() * 0.15)}" fill="none"/>`
  }
  // Panel çerçeveleri (kahvehane tezgâhı)
  const panelTop = y + topH + H * 0.03
  const panelH = H * 0.16
  const pw = W / Math.max(3, Math.round(W / 360))
  for (let x = 0; x < W - 10; x += pw) {
    s += `<path d="${rrectPath(x + 22, panelTop, pw - 44, panelH, 10)}" fill="none" stroke="#2E1A0C" stroke-width="8" opacity=".45"/>`
    s += `<path d="${rrectPath(x + 28, panelTop + 6, pw - 56, panelH - 12, 8)}" fill="none" stroke="#9A6A40" stroke-width="3" opacity=".35"/>`
  }
  // Pirinç ayak demiri
  if (rail) {
    const ry = H * 0.955
    s += `<rect x="0" y="${f(ry - 10)}" width="${W}" height="20" fill="${C.brass}"/><rect x="0" y="${f(ry - 6)}" width="${W}" height="5" fill="#F6DB82" opacity=".8"/><rect x="0" y="${f(ry + 6)}" width="${W}" height="4" fill="#8A6A12"/>`
  }
  // Tezgâh üstü
  s += `<rect x="0" y="${f(y)}" width="${W}" height="${f(topH)}" fill="${top}"/>`
  s += `<rect x="0" y="${f(y)}" width="${W}" height="5" fill="#C98D5A"/>`
  s += `<rect x="0" y="${f(y + topH - 6)}" width="${W}" height="6" fill="#2E1A0C" opacity=".6"/>`
  for (let i = 0; i < 16; i++) {
    const x0 = r() * W
    s += `<path d="M${f(x0)} ${f(y + 8 + r() * (topH - 16))} h${f(80 + r() * 200)}" stroke="#4A2C16" stroke-width="2" opacity=".25"/>`
  }
  // Tezgâhın altına doğru koyulaşma
  s += `<rect x="0" y="${f(y + topH)}" width="${W}" height="${f(H - y - topH)}" fill="url(#cshade)"/>`
  return s
}

const COUNTER_DEFS = `<linearGradient id="cshade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
  <radialGradient id="vign" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2A1408" stop-opacity=".45"/></radialGradient>`

function plasterWall(W, y0, y1, color, seed) {
  const r = rng(seed)
  let s = `<rect x="0" y="${f(y0)}" width="${W}" height="${f(y1 - y0)}" fill="${color}"/>`
  for (let i = 0; i < 40; i++) {
    s += `<ellipse cx="${f(r() * W)}" cy="${f(y0 + r() * (y1 - y0))}" rx="${f(60 + r() * 200)}" ry="${f(30 + r() * 90)}" fill="${r() > 0.5 ? '#FFFFFF' : '#C9B48E'}" opacity="${f(0.06 + r() * 0.08)}" filter="url(#b24)"/>`
  }
  return s
}

/** İznik çini: mavi-beyaz lale motifli kare. */
function tile(x, y, s, variant = 0) {
  const c = x + s / 2
  const m = y + s / 2
  const u = s / 100
  let o = `<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" fill="#F4F1E6"/>`
  o += `<rect x="${f(x + 2)}" y="${f(y + 2)}" width="${f(s - 4)}" height="${f(s - 4)}" fill="none" stroke="${C.cobalt}" stroke-width="${f(3 * u)}"/>`
  // Köşe çeyrek daireleri (komşu karolarla desen oluşturur)
  for (const [cx, cy] of [
    [x, y],
    [x + s, y],
    [x, y + s],
    [x + s, y + s],
  ]) {
    o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(18 * u)}" fill="${C.turq}"/>`
    o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(9 * u)}" fill="#F4F1E6"/>`
  }
  // Merkez lale
  o += `<path d="M${f(c)} ${f(m + 34 * u)} Q${f(c - 4 * u)} ${f(m)} ${f(c)} ${f(m - 8 * u)}" stroke="${C.cobalt}" stroke-width="${f(4 * u)}" fill="none"/>`
  o += `<path d="M${f(c)} ${f(m + 18 * u)} q${f(-22 * u)} ${f(-2 * u)} ${f(-24 * u)} ${f(-22 * u)} q${f(18 * u)} ${f(2 * u)} ${f(24 * u)} ${f(22 * u)}Z" fill="${C.cobalt}"/>`
  o += `<path d="M${f(c)} ${f(m + 18 * u)} q${f(22 * u)} ${f(-2 * u)} ${f(24 * u)} ${f(-22 * u)} q${f(-18 * u)} ${f(2 * u)} ${f(-24 * u)} ${f(22 * u)}Z" fill="${C.cobalt}"/>`
  const tc = variant % 5 === 2 ? '#B5523A' : C.cobalt
  o += `<path d="M${f(c - 14 * u)} ${f(m - 6 * u)} q${f(2 * u)} ${f(-22 * u)} ${f(14 * u)} ${f(-28 * u)} q${f(12 * u)} ${f(6 * u)} ${f(14 * u)} ${f(28 * u)} q${f(-14 * u)} ${f(8 * u)} ${f(-28 * u)} 0Z" fill="${tc}"/>`
  o += `<path d="M${f(c - 5 * u)} ${f(m - 30 * u)} l${f(5 * u)} ${f(-12 * u)} l${f(5 * u)} ${f(12 * u)}Z" fill="${tc}"/>`
  // Çapraz küçük yapraklar
  for (const [dx, dy, rot] of [
    [-30, -30, -45],
    [30, -30, 45],
    [-30, 30, 45],
    [30, 30, -45],
  ]) {
    o += `<ellipse cx="${f(c + dx * u)}" cy="${f(m + dy * u)}" rx="${f(10 * u)}" ry="${f(4 * u)}" transform="rotate(${rot} ${f(c + dx * u)} ${f(m + dy * u)})" fill="${C.turq}"/>`
  }
  return o
}

function tileWall(W, y0, y1, calm = 0.35) {
  const s = W / Math.max(7, Math.round(W / 150))
  let o = `<rect x="0" y="${f(y0)}" width="${W}" height="${f(y1 - y0)}" fill="#E9E3D1"/>`
  let k = 0
  o += `<g filter="url(#b2)">`
  for (let y = y0; y < y1; y += s) {
    for (let x = 0; x < W; x += s) o += tile(x, y, s, k++)
  }
  o += `</g>`
  // Sakinleştirme: krem perde + hafif yumuşatma
  o += `<rect x="0" y="${f(y0)}" width="${W}" height="${f(y1 - y0)}" fill="#F3EBDA" opacity="${calm}"/>`
  // Bordür
  o += `<rect x="0" y="${f(y0 - 18)}" width="${W}" height="30" fill="${C.cobalt}"/>`
  for (let x = 0; x < W; x += 40) o += `<circle cx="${x + 20}" cy="${f(y0 - 3)}" r="7" fill="${C.turq}"/>`
  o += `<rect x="0" y="${f(y0 - 26)}" width="${W}" height="10" fill="#6B4425"/><rect x="0" y="${f(y0 - 26)}" width="${W}" height="3" fill="#B07A4A"/>`
  return o
}

function shelf(W, y, items) {
  let s = `<rect x="0" y="${f(y)}" width="${W}" height="26" fill="#6B4425"/><rect x="0" y="${f(y)}" width="${W}" height="6" fill="#A87442"/><rect x="0" y="${f(y + 26)}" width="${W}" height="10" fill="#000" opacity=".18" filter="url(#b4)"/>`
  for (let x = 60; x < W; x += 420) s += `<path d="M${x} ${f(y + 26)} l30 0 l-30 50Z" fill="#5A3820" stroke="${C.out}" stroke-width="4"/>`
  s += items
  return s
}

function teaTin(x, baseY, h, color) {
  const w = h * 0.62
  const body = rrectPath(x - w / 2, baseY - h, w, h, 6)
  return (
    cel(body, color, { sw: 5, hl: [x - w * 0.25, baseY - h * 0.6, w * 0.12, h * 0.25], inner: `<rect x="${f(x - w / 2)}" y="${f(baseY - h * 0.62)}" width="${f(w)}" height="${f(h * 0.28)}" fill="#F3E6C8" opacity=".85"/><circle cx="${f(x)}" cy="${f(baseY - h * 0.48)}" r="${f(h * 0.09)}" fill="${color}"/>` }) +
    cel(rrectPath(x - w / 2 - 3, baseY - h - 10, w + 6, 16, 4), C.brass, { sw: 4 })
  )
}

function wallClock(cx, cy, r) {
  let s = `<rect x="${f(cx - 4)}" y="${f(cy - r - 40)}" width="8" height="40" fill="#5A3820"/>`
  s += cel(ellipsePath(cx, cy, r, r), '#7A4E2C', { sw: 7, hl: [cx - r * 0.5, cy - r * 0.5, r * 0.3, r * 0.15] })
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.8)}" fill="#F7EEDB" stroke="${C.out}" stroke-width="5"/>`
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    s += `<circle cx="${f(cx + Math.cos(a) * r * 0.66)}" cy="${f(cy + Math.sin(a) * r * 0.66)}" r="${f(i % 3 ? r * 0.03 : r * 0.05)}" fill="${C.out}"/>`
  }
  s += line(`M${cx} ${cy} L${f(cx + r * 0.05)} ${f(cy - r * 0.48)}`, r * 0.07) + line(`M${cx} ${cy} L${f(cx + r * 0.42)} ${f(cy + r * 0.16)}`, r * 0.05)
  s += `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.07)}" fill="${C.tea}"/>`
  // Sarkaç kutusu
  s += cel(rrectPath(cx - r * 0.35, cy + r * 0.9, r * 0.7, r * 1.1, 10), '#7A4E2C', { sw: 6, inner: `<circle cx="${cx}" cy="${f(cy + r * 1.7)}" r="${f(r * 0.16)}" fill="${C.brass}"/>` })
  return s
}

function windowStreet(x, y, w, h, mode = 'day') {
  const id = `win${Math.round(x)}${Math.round(y)}${mode}`
  const sky = mode === 'snow' ? '#5D7FA3' : mode === 'night' ? '#4B2C6E' : '#9ED4F0'
  let inside = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sky}"/>`
  if (mode === 'night') {
    inside += `<circle cx="${f(x + w * 0.68)}" cy="${f(y + h * 0.3)}" r="${f(w * 0.16)}" fill="#FFF3C4"/><circle cx="${f(x + w * 0.68)}" cy="${f(y + h * 0.3)}" r="${f(w * 0.26)}" fill="#FFF3C4" opacity=".25" filter="url(#b14)"/>`
    for (let i = 0; i < 12; i++) inside += `<circle cx="${f(x + ((i * 47) % 100) * w * 0.01)}" cy="${f(y + ((i * 31) % 50) * h * 0.01)}" r="2" fill="#fff" opacity=".7"/>`
  }
  // Karşı binalar (penceresiz düz silüetler)
  const r = rng(id)
  const bcol = mode === 'night' ? '#2C1B45' : mode === 'snow' ? '#7E93A8' : '#E7C9A0'
  let bx = x - 10
  while (bx < x + w) {
    const bw = w * (0.25 + r() * 0.3)
    const bh = h * (0.35 + r() * 0.35)
    inside += `<rect x="${f(bx)}" y="${f(y + h - bh)}" width="${f(bw)}" height="${f(bh)}" fill="${mix(bcol, r() > 0.5 ? '#C98D5A' : '#9A6A40', mode === 'night' ? 0.15 : 0.25)}"/>`
    inside += `<path d="M${f(bx - 4)} ${f(y + h - bh)} L${f(bx + bw / 2)} ${f(y + h - bh - 26)} L${f(bx + bw + 4)} ${f(y + h - bh)}Z" fill="${mode === 'snow' ? '#F5F7FA' : '#B5523A'}"/>`
    if (mode === 'night') inside += `<rect x="${f(bx + bw * 0.3)}" y="${f(y + h - bh * 0.7)}" width="${f(bw * 0.18)}" height="${f(bh * 0.18)}" fill="#F6C445" opacity=".8"/>`
    bx += bw + 6
  }
  if (mode === 'snow') {
    for (let i = 0; i < 70; i++) inside += `<circle cx="${f(x + r() * w)}" cy="${f(y + r() * h)}" r="${f(2 + r() * 4)}" fill="#fff" opacity="${f(0.6 + r() * 0.4)}"/>`
    inside += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" opacity=".22"/>`
    inside += `<ellipse cx="${f(x + w * 0.5)}" cy="${f(y + h * 0.9)}" rx="${f(w * 0.6)}" ry="${f(h * 0.25)}" fill="#fff" opacity=".45" filter="url(#b14)"/>`
  }
  let s = `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})">${inside}</g>`
  // Çerçeve ve kayıtlar
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#6B4425" stroke-width="22"/>`
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.out}" stroke-width="6"/>`
  s += `<path d="M${f(x + w / 2)} ${y} V${y + h} M${x} ${f(y + h * 0.45)} H${x + w}" stroke="#6B4425" stroke-width="14"/>`
  // Pencere pervazı
  s += `<rect x="${x - 26}" y="${y + h}" width="${w + 52}" height="22" fill="#7A4E2C" stroke="${C.out}" stroke-width="5"/>`
  if (mode === 'snow') s += `<path d="M${x - 24} ${y + h + 2} q${w * 0.25} -20 ${w * 0.5} -6 q${w * 0.3} -18 ${w * 0.5 + 48} 4Z" fill="#fff" stroke="${C.out}" stroke-width="4"/>`
  // Camdan giren ışık
  s += `<path d="M${x} ${y} L${x + w} ${y} L${x + w * 2.4} ${y + h * 3.2} L${x + w * 0.6} ${y + h * 3.2}Z" fill="#FFF6DA" opacity="${mode === 'night' ? 0.05 : 0.12}" filter="url(#b24)"/>`
  return s
}

/** Uzakta tavla oynayan iki yaşlı adam: flu silüet. */
function tavlaPlayers(cx, baseY, sc, tone = '#6E5844') {
  const p = (x, flip, cap) => {
    const k = flip ? -1 : 1
    const head = ellipsePath(x, baseY - 230 * sc, 34 * sc, 38 * sc)
    const body = `M${f(x - 60 * sc)} ${f(baseY - 20 * sc)} C${f(x - 64 * sc)} ${f(baseY - 140 * sc)} ${f(x - 40 * sc)} ${f(baseY - 186 * sc)} ${f(x)} ${f(baseY - 190 * sc)} C${f(x + 40 * sc)} ${f(baseY - 186 * sc)} ${f(x + 64 * sc)} ${f(baseY - 140 * sc)} ${f(x + 60 * sc)} ${f(baseY - 20 * sc)}Z`
    const arm = `M${f(x + 30 * sc * k)} ${f(baseY - 150 * sc)} q${f(60 * sc * k)} ${f(20 * sc)} ${f(90 * sc * k)} ${f(56 * sc)}`
    let s = `<path d="${body}" fill="${tone}"/><path d="${head}" fill="${shade(tone, 1.1)}"/>`
    s += `<path d="${arm}" stroke="${tone}" stroke-width="${f(28 * sc)}" stroke-linecap="round" fill="none"/>`
    if (cap) s += `<path d="M${f(x - 40 * sc)} ${f(baseY - 240 * sc)} q${f(40 * sc)} ${f(-50 * sc)} ${f(80 * sc)} 0 l${f(14 * sc * k)} ${f(6 * sc)}Z" fill="${shade(tone, 0.8)}"/>`
    // Bıyık
    s += `<path d="M${f(x - 14 * sc)} ${f(baseY - 216 * sc)} q${f(14 * sc)} ${f(8 * sc)} ${f(28 * sc)} 0" stroke="#F0EAE0" stroke-width="${f(8 * sc)}" fill="none" opacity=".7"/>`
    return s
  }
  let s = p(cx - 130 * sc, false, true) + p(cx + 130 * sc, true, false)
  // Masa ve tavla
  s += `<rect x="${f(cx - 90 * sc)}" y="${f(baseY - 110 * sc)}" width="${f(180 * sc)}" height="${f(16 * sc)}" fill="#5A3820"/>`
  s += `<rect x="${f(cx - 70 * sc)}" y="${f(baseY - 130 * sc)}" width="${f(140 * sc)}" height="${f(22 * sc)}" fill="#A0703F"/>`
  s += `<rect x="${f(cx - 4 * sc)}" y="${f(baseY - 130 * sc)}" width="${f(8 * sc)}" height="${f(22 * sc)}" fill="#5A3820"/>`
  s += `<rect x="${f(cx - 10 * sc)}" y="${f(baseY - 94 * sc)}" width="${f(20 * sc)}" height="${f(94 * sc)}" fill="#4A2C16"/>`
  return `<g filter="url(#b8)" opacity=".7">${s}</g>`
}

function hangingLamp(cx, y, len, glowOn = true) {
  let s = `<path d="M${cx} 0 V${y}" stroke="${C.out}" stroke-width="5"/>`
  s += cel(`M${cx - 60} ${y + len} Q${cx} ${y - 10} ${cx + 60} ${y + len}Z`, '#1E6B5A', { sw: 6, hl: [cx - 20, y + 16, 14, 6] })
  s += `<ellipse cx="${cx}" cy="${y + len + 6}" rx="22" ry="12" fill="#FFE9A8" stroke="${C.out}" stroke-width="4"/>`
  if (glowOn) s += `<ellipse cx="${cx}" cy="${y + len + 40}" rx="200" ry="140" fill="#FFE2A0" opacity=".16" filter="url(#b40)"/>`
  return s
}

// ---------- Mahalle ----------

function mahalle(W, H, theme) {
  const tileTop = H * 0.4
  const counterY = H * COUNTER
  const night = theme === 'halloween'
  let s = ''
  const wallColor = night ? '#D7C7B4' : theme === 'yaz' ? '#F4EAD3' : '#EFE5CF'
  s += plasterWall(W, 0, tileTop, wallColor, 'wall' + W)
  s += tileWall(W, tileTop, counterY, night ? 0.62 : 0.58)
  // Raf
  const shelfY = H * 0.255
  let items = ''
  const r = rng('shelf' + W + theme)
  const step = W / 12
  for (let i = 0; i < 12; i++) {
    const x = step * (i + 0.5)
    if (x > W * 0.36 && x < W * 0.64 && theme !== 'halloween') {
      // Ortada ince belli bardaklar (sade)
      items += `<g opacity=".95">${tulipGlass(x, shelfY + 2, H * 0.05, { saucer: false, empty: true })}</g>`
      continue
    }
    if (theme === 'halloween' && i % 3 === 1) {
      items += pumpkinLantern(x, shelfY + 2, H * 0.04)
      continue
    }
    if (i % 4 === 0) items += teaTin(x, shelfY + 2, H * 0.06, [C.tea, C.cobalt, '#2E7D32', '#B5523A'][Math.floor(r() * 4)])
    else if (i % 4 === 2) items += teaTin(x, shelfY + 2, H * 0.05, [C.turq, C.tea, '#C9A227'][Math.floor(r() * 3)])
    else items += `<g>${tulipGlass(x, shelfY + 2, H * 0.045, { saucer: false })}</g>`
  }
  if (theme === 'halloween') {
    items += candle(W * 0.42, shelfY + 2, H * 0.035) + candle(W * 0.58, shelfY + 2, H * 0.03)
  }
  s += shelf(W, shelfY, items)
  // Pencere / kapı
  const winW = W * 0.24
  const winH = H * 0.13
  if (theme === 'yaz') {
    s += openDoor(W * 0.06, H * 0.06, W * 0.26, counterY - H * 0.06)
  } else {
    s += windowStreet(W * 0.07, H * 0.06, winW, winH, theme === 'kis' ? 'snow' : night ? 'night' : 'day')
  }
  // Saat
  s += wallClock(W * 0.82, H * 0.11, W * 0.065)
  // Lamba(lar)
  if (theme !== 'yaz') s += hangingLamp(W * 0.5, H * 0.02, H * 0.035)
  else s += ceilingFan(W * 0.52, H * 0.03, W * 0.2)
  // Arkada tavla oynayan iki adam (sol), boş masa (sağ)
  const sc = W / 1080
  s += tavlaPlayers(W * 0.2, counterY - H * 0.005, sc * 1.05, night ? '#4A3A52' : '#6E5844')
  s += `<g filter="url(#b4)" opacity=".7"><rect x="${f(W * 0.72)}" y="${f(counterY - 120 * sc)}" width="${f(170 * sc)}" height="${f(16 * sc)}" fill="#5A3820"/><rect x="${f(W * 0.72 + 75 * sc)}" y="${f(counterY - 104 * sc)}" width="${f(20 * sc)}" height="${f(104 * sc)}" fill="#4A2C16"/>${tulipGlass(W * 0.72 + 85 * sc, counterY - 120 * sc, 60 * sc, { saucer: true })}</g>`
  if (theme === 'kis') s += stove(W * 0.9, counterY, H * 0.24)
  if (night) s += cobweb(0, 0, W * 0.22, 1) + cobweb(W, 0, W * 0.22, -1)
  // Işık
  if (theme === 'kis') s += `<rect width="${W}" height="${H}" fill="#FF9A3C" opacity=".07"/>`
  if (night) s += `<rect width="${W}" height="${f(counterY)}" fill="#3A2459" opacity=".16"/><ellipse cx="${W * 0.5}" cy="${H * 0.28}" rx="${W * 0.5}" ry="${H * 0.2}" fill="#FFB347" opacity=".08" filter="url(#b40)"/>`
  if (theme === 'yaz') s += `<rect width="${W}" height="${H}" fill="#FFE8A0" opacity=".06"/>`
  s += counter(W, H)
  s += `<rect width="${W}" height="${H}" fill="url(#vign)"/>`
  return svg(W, H, s, COUNTER_DEFS)
}

function pumpkinLantern(cx, baseY, h) {
  const r = h * 0.6
  const cy = baseY - r * 0.85
  const body = smoothPath([[cx, cy - r * 0.8], [cx + r, cy - r * 0.5], [cx + r * 1.1, cy + r * 0.2], [cx + r * 0.7, cy + r * 0.8], [cx, cy + r * 0.85], [cx - r * 0.7, cy + r * 0.8], [cx - r * 1.1, cy + r * 0.2], [cx - r, cy - r * 0.5]])
  return `<ellipse cx="${cx}" cy="${cy}" rx="${f(r * 2.4)}" ry="${f(r * 1.8)}" fill="#FFB347" opacity=".35" filter="url(#b14)"/>` +
    cel(body, '#F07C1E', { sw: 4, inner: `<path d="M${cx} ${f(cy - r * 0.8)} Q${f(cx - r * 0.3)} ${cy} ${cx} ${f(cy + r * 0.85)}" stroke="#C25A12" stroke-width="3" fill="none"/>` }) +
    `<path d="M${f(cx - r * 0.45)} ${f(cy - r * 0.05)} l${f(r * 0.18)} ${f(-r * 0.22)} l${f(r * 0.14)} ${f(r * 0.22)}Z M${f(cx + r * 0.15)} ${f(cy - r * 0.05)} l${f(r * 0.16)} ${f(-r * 0.22)} l${f(r * 0.14)} ${f(r * 0.22)}Z M${f(cx - r * 0.42)} ${f(cy + r * 0.28)} q${f(r * 0.42)} ${f(r * 0.3)} ${f(r * 0.84)} 0 q${f(-r * 0.42)} ${f(r * 0.14)} ${f(-r * 0.84)} 0Z" fill="#FFE07A"/>` +
    `<rect x="${f(cx - 4)}" y="${f(cy - r * 1.1)}" width="8" height="${f(r * 0.34)}" fill="#4E9A3A" stroke="${C.out}" stroke-width="3"/>`
}

function candle(cx, baseY, h) {
  const w = h * 0.36
  return `<ellipse cx="${cx}" cy="${f(baseY - h - 10)}" rx="${f(h * 0.9)}" ry="${f(h * 0.9)}" fill="#FFD27A" opacity=".35" filter="url(#b14)"/>` +
    cel(rrectPath(cx - w / 2, baseY - h, w, h, 4), '#F3E6C8', { sw: 4 }) +
    `<path d="M${cx} ${f(baseY - h - 4)} q-8 -10 0 -24 q8 14 0 24Z" fill="#FFB347" stroke="${C.out}" stroke-width="3"/>`
}

function cobweb(x, y, size, dir) {
  let s = ''
  const rays = 6
  for (let i = 0; i <= rays; i++) {
    const a = (i / rays) * (Math.PI / 2)
    s += `<path d="M${x} ${y} L${f(x + dir * Math.cos(a) * size)} ${f(y + Math.sin(a) * size)}" stroke="#FFFFFF" stroke-width="3" opacity=".75"/>`
  }
  for (let k = 1; k <= 4; k++) {
    const rr = (k / 4) * size
    let d = ''
    for (let i = 0; i <= rays; i++) {
      const a = (i / rays) * (Math.PI / 2)
      const px = x + dir * Math.cos(a) * rr
      const py = y + Math.sin(a) * rr
      d += i === 0 ? `M${f(px)} ${f(py)}` : ` Q${f(x + dir * Math.cos(a - 0.13) * rr * 0.86)} ${f(y + Math.sin(a - 0.13) * rr * 0.86)} ${f(px)} ${f(py)}`
    }
    s += `<path d="${d}" stroke="#FFFFFF" stroke-width="2.5" fill="none" opacity=".7"/>`
  }
  return s
}

function stove(cx, floorY, h) {
  const w = h * 0.5
  const body = rrectPath(cx - w / 2, floorY - h * 0.7, w, h * 0.62, 18)
  let s = `<ellipse cx="${cx}" cy="${f(floorY - h * 0.4)}" rx="${f(h * 0.9)}" ry="${f(h * 0.7)}" fill="#FF8A3C" opacity=".25" filter="url(#b40)"/>`
  const pipeTop = floorY - h * 1.25
  s += `<rect x="${f(cx - 10)}" y="${f(pipeTop)}" width="20" height="${f(h * 0.55)}" fill="#2B2B2B" stroke="${C.out}" stroke-width="4"/>`
  s += `<path d="M${f(cx)} ${f(pipeTop + 10)} H${f(cx + h)}" stroke="${C.out}" stroke-width="28"/><path d="M${f(cx)} ${f(pipeTop + 10)} H${f(cx + h)}" stroke="#2B2B2B" stroke-width="20"/>`
  s += cel(body, '#2E2E33', { sw: 6, hl: [cx - w * 0.25, floorY - h * 0.6, w * 0.12, h * 0.08], inner: `<rect x="${f(cx - w * 0.28)}" y="${f(floorY - h * 0.45)}" width="${f(w * 0.56)}" height="${f(h * 0.18)}" rx="8" fill="#FF8A3C"/><rect x="${f(cx - w * 0.2)}" y="${f(floorY - h * 0.42)}" width="${f(w * 0.4)}" height="${f(h * 0.1)}" rx="6" fill="#FFD27A"/>` })
  s += `<rect x="${f(cx - w * 0.4)}" y="${f(floorY - h * 0.1)}" width="12" height="${f(h * 0.1)}" fill="#2E2E33"/><rect x="${f(cx + w * 0.4 - 12)}" y="${f(floorY - h * 0.1)}" width="12" height="${f(h * 0.1)}" fill="#2E2E33"/>`
  return s
}

function openDoor(x, y, w, h) {
  let s = ''
  // Güneşli sokak
  const id = 'door' + Math.round(x)
  let inside = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#BDE6F7"/>`
  inside += `<rect x="${x}" y="${f(y + h * 0.55)}" width="${w}" height="${f(h * 0.45)}" fill="#F2D9A6"/>`
  inside += `<rect x="${f(x + w * 0.55)}" y="${f(y + h * 0.15)}" width="${f(w * 0.5)}" height="${f(h * 0.45)}" fill="#F0C8A0"/><path d="M${f(x + w * 0.5)} ${f(y + h * 0.15)} l${f(w * 0.3)} -30 l${f(w * 0.3)} 30Z" fill="#C0583A"/>`
  inside += `<circle cx="${f(x + w * 0.25)}" cy="${f(y + h * 0.2)}" r="${f(w * 0.18)}" fill="#FFF3C4" opacity=".9" filter="url(#b14)"/>`
  s += `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})">${inside}</g>`
  // Açık kanat
  s += cel(`M${x} ${y} L${f(x - w * 0.32)} ${f(y + 30)} L${f(x - w * 0.32)} ${f(y + h + 20)} L${x} ${y + h}Z`, '#5E7F3A', { sw: 6, inner: `<rect x="${f(x - w * 0.26)}" y="${f(y + 60)}" width="${f(w * 0.18)}" height="${f(h * 0.35)}" fill="#4A6A2C"/>` })
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#6B4425" stroke-width="22"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.out}" stroke-width="6"/>`
  // Asma yaprakları ve üzüm
  const r = rng('vine')
  for (let i = 0; i < 14; i++) {
    const lx = x - 40 + r() * (w + 80)
    const ly = y - 30 + r() * 70
    s += `<path d="${starPath(lx, ly, 34, 20, 5, r() * 3)}" fill="${r() > 0.5 ? '#4E9A3A' : '#3F7F2E'}" stroke="${C.out}" stroke-width="4" stroke-linejoin="round"/>`
  }
  for (const gx of [x + w * 0.2, x + w * 0.75]) {
    for (let k = 0; k < 9; k++) s += `<circle cx="${f(gx + ((k % 3) - 1) * 14)}" cy="${f(y + 40 + Math.floor(k / 3) * 14)}" r="9" fill="#6A3D8A" stroke="${C.out}" stroke-width="3"/>`
  }
  // Giren gün ışığı
  s += `<path d="M${x} ${y + h} L${x + w} ${y + h} L${f(x + w * 2.2)} ${f(y + h * 1.5)} L${f(x + w * 0.4)} ${f(y + h * 1.5)}Z" fill="#FFF3C4" opacity=".25" filter="url(#b14)"/>`
  return s
}

function ceilingFan(cx, y, span) {
  let s = `<path d="M${cx} 0 V${f(y + 20)}" stroke="${C.out}" stroke-width="8"/>`
  for (const a of [-12, 12]) {
    s += `<g transform="rotate(${a} ${cx} ${y + 30})">` + cel(rrectPath(cx - span / 2, y + 22, span, 18, 9), '#7A4E2C', { sw: 5 }) + `</g>`
  }
  s += cel(ellipsePath(cx, y + 30, 26, 16), C.brass, { sw: 5 })
  return s
}

// ---------- Sahil ----------

function sahil(W, H) {
  const horizon = H * 0.42
  const counterY = H * COUNTER
  let s = `<defs><linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7EC8EC"/><stop offset="1" stop-color="#D6F0F7"/></linearGradient>
    <linearGradient id="sea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2D8FB5"/><stop offset="1" stop-color="#1E9AA8"/></linearGradient></defs>`
  s += `<rect width="${W}" height="${f(horizon)}" fill="url(#sky)"/>`
  const r = rng('sahil' + W)
  for (let i = 0; i < 6; i++) s += `<ellipse cx="${f(r() * W)}" cy="${f(H * (0.08 + r() * 0.2))}" rx="${f(90 + r() * 140)}" ry="${f(22 + r() * 20)}" fill="#fff" opacity=".7" filter="url(#b14)"/>`
  // Ada silüeti
  s += `<path d="M${f(W * 0.55)} ${f(horizon)} Q${f(W * 0.66)} ${f(horizon - H * 0.05)} ${f(W * 0.74)} ${f(horizon - H * 0.035)} Q${f(W * 0.84)} ${f(horizon - H * 0.06)} ${f(W * 0.95)} ${f(horizon)}Z" fill="#7FA2B3" opacity=".85"/>`
  s += `<rect y="${f(horizon)}" width="${W}" height="${f(counterY - horizon)}" fill="url(#sea)"/>`
  for (let i = 0; i < 40; i++) {
    const y = horizon + 10 + r() * (counterY - horizon - 20)
    s += `<path d="M${f(r() * W)} ${f(y)} h${f(20 + r() * 60)}" stroke="#E8F7FB" stroke-width="${f(2 + ((y - horizon) / H) * 12)}" opacity=".35" stroke-linecap="round"/>`
  }
  // Martılar
  for (let i = 0; i < 5; i++) {
    const x = W * (0.15 + r() * 0.7)
    const y = H * (0.12 + r() * 0.2)
    const sc = 0.6 + r() * 0.8
    s += line(`M${f(x - 26 * sc)} ${f(y)} q${f(13 * sc)} ${f(-14 * sc)} ${f(26 * sc)} 0 q${f(13 * sc)} ${f(-14 * sc)} ${f(26 * sc)} 0`, 5, '#3B4650')
  }
  // Alçak duvar ve renkli tabureler (flu)
  const wallY = counterY - H * 0.07
  s += `<rect y="${f(wallY)}" width="${W}" height="${f(H * 0.07)}" fill="#F0E2C8"/><rect y="${f(wallY)}" width="${W}" height="10" fill="#D9C7A2"/>`
  let stools = ''
  for (let i = 0; i < 7; i++) {
    const x = (W / 7) * (i + 0.5)
    const col = ['#C0392B', '#1F4E8C', '#F6C445', '#2E7D32', '#E07A5F'][i % 5]
    stools += `<rect x="${f(x - 40)}" y="${f(wallY - 70)}" width="80" height="16" rx="6" fill="${col}"/><rect x="${f(x - 32)}" y="${f(wallY - 56)}" width="8" height="60" fill="${shade(col, 0.7)}"/><rect x="${f(x + 24)}" y="${f(wallY - 56)}" width="8" height="60" fill="${shade(col, 0.7)}"/>`
  }
  s += `<g filter="url(#b4)" opacity=".85">${stools}</g>`
  // Ağaç gölgesi: üstte yaprak kümeleri
  let leaves = ''
  for (let i = 0; i < 80; i++) {
    leaves += `<ellipse cx="${f(r() * W)}" cy="${f(r() * H * 0.16 - 20)}" rx="${f(40 + r() * 70)}" ry="${f(30 + r() * 50)}" fill="${['#2E6B30', '#3F8A3A', '#4E9A3A'][Math.floor(r() * 3)]}"/>`
  }
  s += `<g>${leaves}</g>`
  s += `<rect y="${f(H * 0.1)}" width="${W}" height="${f(H * 0.08)}" fill="#2E6B30" opacity=".0"/>`
  // Benekli gölge
  for (let i = 0; i < 14; i++) s += `<ellipse cx="${f(r() * W)}" cy="${f(counterY + r() * 40)}" rx="${f(40 + r() * 60)}" ry="12" fill="#000" opacity=".12" filter="url(#b8)"/>`
  s += counter(W, H, { wood: '#6A4426', top: '#8A5A33' })
  s += `<rect width="${W}" height="${H}" fill="url(#vign)" opacity=".7"/>`
  return svg(W, H, s, COUNTER_DEFS)
}

// ---------- Rize ----------

function rize(W, H) {
  const counterY = H * COUNTER
  let s = `<defs><linearGradient id="rsky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#BFE0E8"/><stop offset="1" stop-color="#EEF5EE"/></linearGradient></defs>`
  s += `<rect width="${W}" height="${f(counterY)}" fill="url(#rsky)"/>`
  const r = rng('rize' + W)
  // Sisli uzak tepeler
  const hill = (y, amp, col, op, blur) => {
    let d = `M0 ${f(counterY)} L0 ${f(y)}`
    for (let x = 0; x <= W; x += W / 8) d += ` Q${f(x + W / 16)} ${f(y - amp * (0.4 + r()))} ${f(x + W / 8)} ${f(y + (r() - 0.5) * amp * 0.4)}`
    d += ` L${W} ${f(counterY)}Z`
    return `<path d="${d}" fill="${col}" opacity="${op}" ${blur ? `filter="url(#${blur})"` : ''}/>`
  }
  s += hill(H * 0.24, H * 0.06, '#9DBFB4', 0.8, 'b8')
  s += hill(H * 0.3, H * 0.05, '#7FAE8C', 0.9, 'b4')
  s += `<rect y="${f(H * 0.26)}" width="${W}" height="${f(H * 0.06)}" fill="#fff" opacity=".45" filter="url(#b24)"/>`
  // Teraslı çay tarlaları
  const terraces = (y0, y1, base) => {
    let o = ''
    const rows = 9
    for (let i = 0; i < rows; i++) {
      const y = y0 + ((y1 - y0) * i) / rows
      const hh = (y1 - y0) / rows
      const col = mix(base, i % 2 ? '#5FA845' : '#3F8A3A', 0.5)
      let d = `M0 ${f(y + hh)} L0 ${f(y + hh * 0.2)}`
      for (let x = 0; x <= W; x += W / 6) d += ` Q${f(x + W / 12)} ${f(y - hh * 0.25 + (r() - 0.5) * 8)} ${f(x + W / 6)} ${f(y + hh * 0.2)}`
      d += ` L${W} ${f(y + hh)}Z`
      o += `<path d="${d}" fill="${col}"/>`
      // Çay sırası dokusu
      for (let x = 10; x < W; x += 34) o += `<circle cx="${f(x + (i % 2) * 17)}" cy="${f(y + hh * 0.55)}" r="${f(hh * 0.22)}" fill="${shade(col, 0.85)}" opacity=".5"/>`
    }
    return o
  }
  s += terraces(H * 0.34, counterY, '#4E9A3A')
  s += `<rect y="${f(H * 0.34)}" width="${W}" height="${f(counterY - H * 0.34)}" fill="#EAF4E4" opacity=".28"/>`
  // Ahşap kulübe çatısı (üstte)
  const roofH = H * 0.12
  s += `<path d="M-20 0 H${W + 20} V${f(roofH)} L${f(W * 0.5)} ${f(roofH + H * 0.03)} L-20 ${f(roofH)}Z" fill="#6B4425"/>`
  for (let x = 0; x < W; x += 60) s += `<rect x="${x}" y="0" width="8" height="${f(roofH)}" fill="#4A2C16" opacity=".5"/>`
  s += `<path d="M-20 ${f(roofH)} L${f(W * 0.5)} ${f(roofH + H * 0.03)} L${W + 20} ${f(roofH)}" stroke="${C.out}" stroke-width="10" fill="none"/>`
  // Direkler
  for (const x of [W * 0.04, W * 0.96]) s += `<rect x="${f(x - 22)}" y="0" width="44" height="${f(counterY)}" fill="#6B4425" stroke="${C.out}" stroke-width="6"/>`
  s += counter(W, H, { wood: '#7A5232', top: '#946640', rail: false })
  s += `<rect width="${W}" height="${H}" fill="url(#vign)" opacity=".6"/>`
  return svg(W, H, s, COUNTER_DEFS)
}

// ---------- Boğaz vapuru ----------

function bogaz(W, H) {
  const counterY = H * COUNTER
  let s = `<rect width="${W}" height="${f(counterY)}" fill="#E9DDC4"/>`
  // Ahşap lambri alt bölüm
  s += `<rect y="${f(H * 0.56)}" width="${W}" height="${f(counterY - H * 0.56)}" fill="#8A5A33"/>`
  for (let x = 0; x < W; x += 90) s += `<rect x="${x}" y="${f(H * 0.56)}" width="6" height="${f(counterY - H * 0.56)}" fill="#5A3820"/>`
  // Büyük pencereler
  const winY = H * 0.17
  const winH = H * 0.36
  const n = W > 1200 ? 3 : 2
  const gap = W * 0.05
  const ww = (W - gap * (n + 1)) / n
  const r = rng('bogaz' + W)
  for (let i = 0; i < n; i++) {
    const x = gap + i * (ww + gap)
    const id = 'bw' + i + W
    let view = `<rect x="${f(x)}" y="${f(winY)}" width="${f(ww)}" height="${f(winH)}" fill="#A9DAF2"/>`
    const sea = winY + winH * 0.58
    // Karşı kıyı tepeleri ve evler
    view += `<path d="M${f(x)} ${f(sea)} Q${f(x + ww * 0.3)} ${f(sea - winH * 0.22)} ${f(x + ww * 0.6)} ${f(sea - winH * 0.12)} T${f(x + ww)} ${f(sea - winH * 0.16)} V${f(sea)}Z" fill="#7BA77F"/>`
    for (let k = 0; k < 10; k++) view += `<rect x="${f(x + r() * ww)}" y="${f(sea - winH * (0.04 + r() * 0.1))}" width="${f(10 + r() * 16)}" height="${f(8 + r() * 12)}" fill="${['#F3E6C8', '#E8A87C', '#F0F0F0'][k % 3]}"/>`
    view += `<rect x="${f(x)}" y="${f(sea)}" width="${f(ww)}" height="${f(winH)}" fill="#2D7FA8"/>`
    for (let k = 0; k < 12; k++) view += `<path d="M${f(x + r() * ww)} ${f(sea + 10 + r() * winH * 0.35)} h${f(14 + r() * 40)}" stroke="#DFF3FA" stroke-width="4" opacity=".5" stroke-linecap="round"/>`
    // Köprü silüeti (orta pencerede)
    if (i === Math.floor((n - 1) / 2)) {
      const by = sea - winH * 0.06
      const t1 = x + ww * 0.2
      const t2 = x + ww * 0.8
      view += `<rect x="${f(t1 - 6)}" y="${f(by - winH * 0.32)}" width="12" height="${f(winH * 0.32)}" fill="#6E7F8C"/><rect x="${f(t2 - 6)}" y="${f(by - winH * 0.32)}" width="12" height="${f(winH * 0.32)}" fill="#6E7F8C"/>`
      view += `<path d="M${f(x - 10)} ${f(by - winH * 0.1)} Q${f((t1 + x) / 2)} ${f(by - winH * 0.18)} ${f(t1)} ${f(by - winH * 0.32)} Q${f((t1 + t2) / 2)} ${f(by - winH * 0.02)} ${f(t2)} ${f(by - winH * 0.32)} Q${f((t2 + x + ww) / 2)} ${f(by - winH * 0.18)} ${f(x + ww + 10)} ${f(by - winH * 0.1)}" stroke="#6E7F8C" stroke-width="5" fill="none"/>`
      view += `<rect x="${f(x)}" y="${f(by)}" width="${f(ww)}" height="10" fill="#6E7F8C"/>`
    }
    for (let k = 0; k < 2; k++) {
      const gx = x + ww * (0.2 + r() * 0.6)
      const gy = winY + winH * (0.12 + r() * 0.2)
      view += line(`M${f(gx - 20)} ${f(gy)} q10 -12 20 0 q10 -12 20 0`, 4, '#3B4650')
    }
    s += `<clipPath id="${id}"><path d="${rrectPath(x, winY, ww, winH, 40)}"/></clipPath><g clip-path="url(#${id})">${view}</g>`
    s += `<path d="${rrectPath(x, winY, ww, winH, 40)}" fill="none" stroke="#6B4425" stroke-width="26"/><path d="${rrectPath(x, winY, ww, winH, 40)}" fill="none" stroke="${C.out}" stroke-width="6"/>`
  }
  // Tavan ve lambalar
  s += `<rect width="${W}" height="${f(H * 0.08)}" fill="#F3E6C8"/><rect y="${f(H * 0.08)}" width="${W}" height="14" fill="#8A5A33"/>`
  for (let i = 0; i < 3; i++) s += `<circle cx="${f((W / 3) * (i + 0.5))}" cy="${f(H * 0.05)}" r="20" fill="#FFF3C4" stroke="${C.out}" stroke-width="4"/>`
  s += `<rect y="${f(H * 0.5)}" width="${W}" height="${f(H * 0.18)}" fill="#F3E6C8" opacity=".2"/>`
  s += counter(W, H, { wood: '#6B4425', top: '#8A5A33', rail: true })
  s += `<rect width="${W}" height="${H}" fill="url(#vign)" opacity=".6"/>`
  return svg(W, H, s, COUNTER_DEFS)
}

register(
  (id) => id.startsWith('bg_'),
  (a, ctx) => {
    const venue = a.id.split('_')[1]
    if (venue === 'mahalle') return mahalle(a.w, a.h, ctx.theme)
    if (venue === 'sahil') return sahil(a.w, a.h)
    if (venue === 'rize') return rize(a.w, a.h)
    if (venue === 'bogaz') return bogaz(a.w, a.h)
    return null
  },
)
