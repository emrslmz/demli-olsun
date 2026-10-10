/**
 * Günün Siparişi paylaşım kartı (1080×1350 PNG). Kareler emoji yerine çizilir; her cihazda aynı görünür.
 */

import type { DailyResultData } from '@/bus'
import { CUSTOMERS, customerImageId } from '@/data/customers'
import { pct1 } from '@/i18n/tr'
import { ThemeService } from '@/services/theme/ThemeService'

const W = 1080
const H = 1350
const INK = '#3B2416'
const PAPER = '#F3E6C8'
const GREEN = '#4E9A3A'
const YELLOW = '#E2B33C'
const EMPTY = '#CDBB95'

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur)
      cur = w
    } else cur = t
  }
  if (cur) lines.push(cur)
  return lines
}

function squares(ctx: CanvasRenderingContext2D, x: number, y: number, score: number, size: number): void {
  for (let i = 0; i < 5; i++) {
    const lo = i * 20
    ctx.fillStyle = score >= lo + 20 ? GREEN : score > lo ? YELLOW : EMPTY
    roundRect(ctx, x + i * (size + 12), y, size, size, 12)
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = INK
    ctx.stroke()
  }
}

export async function renderDailyCard(r: DailyResultData, streak: number): Promise<string> {
  try {
    await Promise.all([document.fonts.load('800 80px "Baloo 2"', 'ğşİ'), document.fonts.load('600 60px "Baloo 2"', 'ğşİ')])
  } catch {
    /* sistem yazı tipi */
  }
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas yok')
  const expr = r.accepted ? (r.stars >= 2 ? 'happy' : 'neutral') : 'angry'
  const [face, logo] = await Promise.all([
    loadImage(ThemeService.url(customerImageId(r.customer, expr))),
    loadImage(ThemeService.url('logo_emblem')),
  ])

  // Ahşap çerçeve + kâğıt
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#8A5A33')
  grad.addColorStop(1, '#5E3B1F')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = PAPER
  roundRect(ctx, 48, 48, W - 96, H - 96, 40)
  ctx.fill()
  ctx.lineWidth = 8
  ctx.strokeStyle = INK
  ctx.stroke()

  // Başlık
  if (logo) ctx.drawImage(logo, 90, 84, 150, 150)
  ctx.fillStyle = INK
  ctx.textBaseline = 'middle'
  ctx.font = '800 84px "Baloo 2", sans-serif'
  ctx.fillText('Demli Olsun', 266, 136)
  ctx.font = '800 54px "Baloo 2", sans-serif'
  ctx.fillStyle = '#8B1E0F'
  ctx.fillText(`Günün Siparişi #${r.dayNumber}`, 270, 206)

  // Müşteri + replik
  const fy = 290
  if (face) ctx.drawImage(face, 90, fy, 230, 230)
  ctx.fillStyle = '#FFFFFF'
  roundRect(ctx, 350, fy + 10, 640, 210, 30)
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.fillStyle = INK
  ctx.font = '800 34px "Baloo 2", sans-serif'
  ctx.globalAlpha = 0.7
  ctx.fillText(CUSTOMERS[r.customer].name, 380, fy + 50)
  ctx.globalAlpha = 1
  ctx.font = '800 40px "Baloo 2", sans-serif'
  wrap(ctx, `“${r.line}”`, 580)
    .slice(0, 3)
    .forEach((l, i) => ctx.fillText(l, 380, fy + 106 + i * 50))

  // İsabet
  ctx.textAlign = 'center'
  ctx.font = '800 44px "Baloo 2", sans-serif'
  ctx.globalAlpha = 0.75
  ctx.fillText('İsabet', W / 2, 600)
  ctx.globalAlpha = 1
  ctx.font = '800 150px "Baloo 2", sans-serif'
  ctx.fillText(`%${pct1(r.accuracy)}`, W / 2, 700)
  // Yıldızlar
  for (let i = 0; i < 3; i++) {
    const cx = W / 2 + (i - 1) * 110
    const cy = 815
    ctx.beginPath()
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5
      const rr = k % 2 === 0 ? 46 : 20
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
    }
    ctx.closePath()
    ctx.fillStyle = i < r.stars ? '#F6C445' : EMPTY
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = INK
    ctx.stroke()
  }

  // Metrikler
  ctx.textAlign = 'left'
  ctx.font = '800 46px "Baloo 2", sans-serif'
  const rows: [string, number][] = [
    ['Renk', r.demScore],
    ['Doluluk', r.fillScore],
  ]
  rows.forEach(([label, score], i) => {
    const y = 920 + i * 110
    ctx.fillStyle = INK
    ctx.fillText(label, 150, y + 40)
    squares(ctx, 430, y, score, 78)
  })

  // Seri
  ctx.textAlign = 'center'
  ctx.fillStyle = '#8B1E0F'
  ctx.font = '800 56px "Baloo 2", sans-serif'
  ctx.fillText(`Seri: ${streak} gün`, W / 2, 1190)
  ctx.fillStyle = INK
  ctx.globalAlpha = 0.6
  ctx.font = '800 36px "Baloo 2", sans-serif'
  ctx.fillText('Mahallenin çaycısı sensin.', W / 2, 1262)
  ctx.globalAlpha = 1

  return canvas.toDataURL('image/png')
}
