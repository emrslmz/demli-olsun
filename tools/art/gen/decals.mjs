// Bardak desenleri (512×512, düz önden). Kodla bardağa silindirik sarılır: görselin ÜSTÜ bardağın ağzıdır.
// Bardak çizilmez; sadece desen.

import { register } from './index.mjs'
import { C, ellipsePath, f, line, starPath, svg } from '../lib/svg.mjs'

const GOLD = '#E3B83F'

function yaldiz() {
  let s = ''
  s += `<rect x="0" y="22" width="512" height="18" fill="${GOLD}"/><rect x="0" y="48" width="512" height="6" fill="${GOLD}"/>`
  for (let i = 0; i < 16; i++) s += `<circle cx="${16 + i * 32}" cy="74" r="6" fill="${GOLD}"/>`
  s += `<rect x="0" y="430" width="512" height="10" fill="${GOLD}"/>`
  for (let i = 0; i < 8; i++) s += `<path d="${starPath(32 + i * 64, 200, 12, 4, 4, 0)}" fill="${GOLD}" opacity=".9"/>`
  return svg(512, 512, `<g stroke="#9A7417" stroke-width="2">${s}</g>`)
}

function lale() {
  let s = ''
  s += `<rect x="0" y="110" width="512" height="5" fill="${C.cobalt}"/><rect x="0" y="236" width="512" height="5" fill="${C.cobalt}"/>`
  for (let i = 0; i < 6; i++) {
    const x = 44 + i * 85
    const y = 220
    s += `<path d="M${x} ${y} q-4 -40 0 -66" stroke="#2E7D32" stroke-width="5" fill="none"/>`
    s += `<path d="M${x} ${y - 20} q-24 -6 -26 -30 q20 4 26 30Z" fill="#2E7D32"/>`
    s += `<path d="M${x - 20} ${y - 70} q2 -30 20 -38 q18 8 20 38 q-20 12 -40 0Z" fill="#C0392B" stroke="#7A1F1A" stroke-width="3"/>`
    s += `<path d="M${x - 6} ${y - 104} l6 -16 l6 16" fill="#C0392B" stroke="#7A1F1A" stroke-width="3"/>`
    s += `<circle cx="${x + 42}" cy="${y - 64}" r="6" fill="${C.turq}"/>`
  }
  return svg(512, 512, s)
}

function nazar() {
  let s = `<path d="M0 150 Q128 180 256 150 T512 150" stroke="#C9A227" stroke-width="4" fill="none"/>`
  for (let i = 0; i < 8; i++) {
    const x = 32 + i * 64
    const y = 150 + Math.sin((i / 8) * Math.PI * 4) * 14
    s += `<g><circle cx="${x}" cy="${f(y)}" r="22" fill="#1F4E8C" stroke="#0F2E57" stroke-width="3"/><circle cx="${x}" cy="${f(y)}" r="15" fill="#fff"/><circle cx="${x}" cy="${f(y)}" r="10" fill="#5BB8E6"/><circle cx="${x}" cy="${f(y)}" r="5" fill="#111"/><circle cx="${x - 7}" cy="${f(y - 8)}" r="4" fill="#fff" opacity=".8"/></g>`
  }
  return svg(512, 512, s)
}

function kristal() {
  let s = ''
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 9; col++) {
      const x = col * 64 + (row % 2 ? 32 : 0)
      const y = 90 + row * 52
      s += `<path d="M${x} ${y - 26} L${x + 28} ${y} L${x} ${y + 26} L${x - 28} ${y}Z" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-opacity=".75" stroke-width="3"/>`
      s += `<path d="M${x - 10} ${y - 10} l8 -6" stroke="#fff" stroke-width="3" opacity=".9"/>`
    }
  }
  s += `<rect x="0" y="16" width="512" height="10" fill="#fff" opacity=".6"/>`
  return svg(512, 512, s)
}

function baslangic() {
  let s = `<rect x="0" y="40" width="512" height="5" fill="#C9A227"/>`
  const leaf = (x, y, r) => `<g transform="rotate(${r} ${x} ${y})"><path d="M${x} ${y} q18 -26 0 -54 q-18 28 0 54Z" fill="#4E9A3A" stroke="#2E5E22" stroke-width="3"/><path d="M${x} ${y} l0 -46" stroke="#2E5E22" stroke-width="2"/></g>`
  for (let i = 0; i < 7; i++) s += leaf(36 + i * 74, 150 + (i % 2) * 40, -20 + (i % 3) * 20)
  for (let i = 0; i < 7; i++) s += `<circle cx="${72 + i * 74}" cy="${110 + (i % 2) * 70}" r="5" fill="#C9A227"/>`
  return svg(512, 512, s)
}

register((id) => id === 'decal_yaldiz', () => yaldiz())
register((id) => id === 'decal_lale', () => lale())
register((id) => id === 'decal_nazar', () => nazar())
register((id) => id === 'decal_kristal', () => kristal())
register((id) => id === 'decal_baslangic', () => baslangic())
export { ellipsePath, line }
