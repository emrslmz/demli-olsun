/** Uygulama saati. Geliştirici menüsünden gün kaydırılabilir (günlük siparişi başka tarih için üretmek). */

let offsetMs = 0

export function now(): Date {
  return new Date(Date.now() + offsetMs)
}

export function shiftDays(days: number): void {
  offsetMs += days * 86400000
}

export function resetClock(): void {
  offsetMs = 0
}

export function clockOffsetDays(): number {
  return Math.round(offsetMs / 86400000)
}
