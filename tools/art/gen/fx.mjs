// Işıma efektleri: siyah zemin üzerine beyaz/açık renk; oyun toplamalı (add) karıştırır, siyah görünmez.
// fx_snowflake ve fx_bat saydam zeminlidir.

import { register } from './index.mjs'
import { C, cel, ellipsePath, f, line, silhouette, starPath, svg } from '../lib/svg.mjs'

function steam() {
  const s = `<rect width="256" height="256" fill="#000"/>
    <path d="M128 236 C88 200 160 168 120 132 C86 100 150 76 124 30" stroke="#fff" stroke-width="34" fill="none" stroke-linecap="round" opacity=".55" filter="url(#b14)"/>
    <path d="M128 236 C92 200 156 168 120 132 C90 102 146 78 124 34" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" opacity=".55" filter="url(#b4)"/>`
  return svg(256, 256, s)
}

function sparkle(color = '#fff') {
  const s = `<rect width="128" height="128" fill="#000"/>
    <circle cx="64" cy="64" r="26" fill="${color}" opacity=".45" filter="url(#b8)"/>
    <path d="${starPath(64, 64, 58, 9, 4, 0)}" fill="${color}" filter="url(#b2)"/>
    <path d="${starPath(64, 64, 30, 6, 4, Math.PI / 4)}" fill="${color}" opacity=".7" filter="url(#b2)"/>
    <circle cx="64" cy="64" r="8" fill="#fff"/>`
  return svg(128, 128, s)
}

function sunGlint() {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    const r = i % 2 ? 40 : 58
    return `<path d="M64 64 L${f(64 + Math.cos(a) * r)} ${f(64 + Math.sin(a) * r)}" stroke="#FFF3C4" stroke-width="${i % 2 ? 4 : 6}" stroke-linecap="round"/>`
  }).join('')
  return svg(128, 128, `<rect width="128" height="128" fill="#000"/><circle cx="64" cy="64" r="30" fill="#FFE59A" opacity=".55" filter="url(#b8)"/><g filter="url(#b2)">${rays}</g><circle cx="64" cy="64" r="12" fill="#FFFBEA"/>`)
}

function snowflake() {
  let arms = ''
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2
    const x2 = 64 + Math.cos(a) * 50
    const y2 = 64 + Math.sin(a) * 50
    const bx = 64 + Math.cos(a) * 30
    const by = 64 + Math.sin(a) * 30
    const b1 = a + 0.7
    const b2 = a - 0.7
    arms += `M64 64 L${f(x2)} ${f(y2)} M${f(bx)} ${f(by)} L${f(bx + Math.cos(b1) * 16)} ${f(by + Math.sin(b1) * 16)} M${f(bx)} ${f(by)} L${f(bx + Math.cos(b2) * 16)} ${f(by + Math.sin(b2) * 16)} `
  }
  return svg(128, 128, line(arms, 16, '#3B5A78') + line(arms, 8, '#FFFFFF') + `<circle cx="64" cy="64" r="9" fill="#fff" stroke="#3B5A78" stroke-width="4"/>`)
}

function bat() {
  const wing = 'M64 66 C52 44 30 36 8 44 C18 52 20 60 16 70 C26 66 34 70 36 80 C44 72 54 72 64 78 C74 72 84 72 92 80 C94 70 102 66 112 70 C108 60 110 52 120 44 C98 36 76 44 64 66Z'
  const body = ellipsePath(64, 70, 14, 18)
  let s = silhouette([wing, body], 8)
  s += cel(wing, '#3A2459', { sw: 5, hl: [40, 52, 14, 6], hlOpacity: 0.3 })
  s += cel(body, '#2C1B45', { sw: 5 })
  s += `<path d="M54 56 L52 44 L60 52Z M74 56 L76 44 L68 52Z" fill="#2C1B45" stroke="${C.out}" stroke-width="3" stroke-linejoin="round"/>`
  s += `<circle cx="59" cy="66" r="4" fill="#F6C445"/><circle cx="69" cy="66" r="4" fill="#F6C445"/><path d="M60 76 l3 4 l3 -4" fill="#fff"/>`
  return svg(128, 128, s)
}

register((id) => id === 'fx_steam', () => steam())
register((id) => id === 'fx_sparkle', () => sparkle())
register((id) => id === 'fx_sun_glint', () => sunGlint())
register((id) => id === 'fx_snowflake', () => snowflake())
register((id) => id === 'fx_bat', () => bat())
