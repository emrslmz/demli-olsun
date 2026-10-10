/** Günün Siparişi: günlük seed, gün numarası, seri ve paylaşım metni. Gün sınırı Europe/Istanbul 00:00. */

import { LAUNCH_DATE } from '@/config/economy'
import { CUSTOMERS, type CustomerId } from '@/data/customers'
import { FILL_TYPES, TEA_TYPES } from '@/data/orderTypes'
import { pickFillType, pickSugar, pickTeaType, type Order } from './orders'
import { Rng } from './rng'

const TZ = 'Europe/Istanbul'

interface WallClock {
  y: number
  m: number
  d: number
  hh: number
  mm: number
  ss: number
}

function istanbulWallClock(date: Date): WallClock {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value ?? '0')
  return { y: get('year'), m: get('month'), d: get('day'), hh: get('hour'), mm: get('minute'), ss: get('second') }
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** Europe/Istanbul takvim günü: 'YYYY-MM-DD'. */
export function istanbulDateKey(date: Date): string {
  const w = istanbulWallClock(date)
  return `${w.y}-${pad(w.m)}-${pad(w.d)}`
}

function keyToUtcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return Date.UTC(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const t = new Date(keyToUtcMs(key) + n * 86400000)
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((keyToUtcMs(toKey) - keyToUtcMs(fromKey)) / 86400000)
}

/** Çıkış tarihinden bu yana gün numarası (#1, #2…). Çıkıştan önceki günler 1'e kırpılır. */
export function dayNumber(dateKey: string, launch: string = LAUNCH_DATE): number {
  return Math.max(1, daysBetween(launch, dateKey) + 1)
}

/** Bir sonraki İstanbul gece yarısına kalan milisaniye. */
export function msUntilNextIstanbulMidnight(now: Date): number {
  const w = istanbulWallClock(now)
  const wallAsUtc = Date.UTC(w.y, w.m - 1, w.d, w.hh, w.mm, w.ss)
  const offset = wallAsUtc - Math.floor(now.getTime() / 1000) * 1000
  const nextMidnightWall = Date.UTC(w.y, w.m - 1, w.d + 1, 0, 0, 0)
  return Math.max(0, nextMidnightWall - offset - now.getTime())
}

export interface DailyChallenge {
  dateKey: string
  dayNumber: number
  order: Order
  flowScale: { dem: number; su: number }
}

const DAILY_CUSTOMERS: CustomerId[] = ['riza', 'muhtar', 'taksici', 'ogrenci']
export const DAILY_PATIENCE = 30

/** Aynı gün herkes aynı siparişi alır: her şey tarihten türetilen seed'den gelir. */
export function dailyChallenge(dateKey: string): DailyChallenge {
  const rng = new Rng(`demli-olsun:daily:${dateKey}`)
  const customer = rng.pick(DAILY_CUSTOMERS)
  const teaType = pickTeaType(rng, customer)
  const fillType = pickFillType(rng, customer)
  const [d0, d1] = TEA_TYPES[teaType].dem
  const [f0, f1] = FILL_TYPES[fillType].fill
  const demTarget = rng.int(d0, d1)
  const fillTarget = rng.int(f0, f1)
  const sugar = pickSugar(rng, 0.3)
  const flowScale = {
    dem: Math.round(rng.float(0.85, 1.2) * 100) / 100,
    su: Math.round(rng.float(0.85, 1.2) * 100) / 100,
  }
  return {
    dateKey,
    dayNumber: dayNumber(dateKey),
    order: {
      id: 1,
      customer,
      teaType,
      demTarget,
      fillType,
      fillTarget,
      sugar,
      patience: DAILY_PATIENCE * CUSTOMERS[customer].patienceFactor,
    },
    flowScale,
  }
}

/** Günlük seri: dün oynandıysa +1, bugün zaten oynandıysa aynı, değilse 1. */
export function nextDailyStreak(lastPlayed: string | null, streak: number, today: string): number {
  if (!lastPlayed) return 1
  if (lastPlayed === today) return streak
  if (addDays(lastPlayed, 1) === today) return streak + 1
  return 1
}

/** Her metrik 5 kareyle: her kare 20 puan; tam dolu 🟩, kısmi 🟨, boş ⬛. */
export function metricSquares(score: number): string {
  let out = ''
  for (let i = 0; i < 5; i++) {
    const lo = i * 20
    if (score >= lo + 20) out += '🟩'
    else if (score > lo) out += '🟨'
    else out += '⬛'
  }
  return out
}

export interface ShareInput {
  dayNumber: number
  customerName: string
  line: string
  demScore: number
  fillScore: number
  streak: number
  storeUrl: string
}

export function buildShareText(s: ShareInput): string {
  return [
    `Demli Olsun #${s.dayNumber} 🫖`,
    `Müşteri: ${s.customerName}`,
    `"${s.line}"`,
    `Renk    ${metricSquares(s.demScore)}`,
    `Doluluk ${metricSquares(s.fillScore)}`,
    `Seri 🔥${s.streak}`,
    s.storeUrl,
  ].join('\n')
}
