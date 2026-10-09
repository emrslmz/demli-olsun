/**
 * Dem oranından görünen çay rengi. Temaya göre ASLA değişmez.
 *
 * Beer–Lambert benzeri model: dem oranı d, ışık yolu L ile ölçeklenmiş bir optik yoğunluğa çevrilir
 * (d' = 1 − (1 − d)^L; geniş bardakta L > 1 olduğundan çay biraz daha koyu görünür). Ardından renk ve
 * opaklık, doğrusal ışık uzayında monoton renk duraklarından okunur. Tüm kanallar d arttıkça azalır,
 * opaklık artar; böylece oyuncu "%35 dem" rengini zamanla gözüyle tanıyabilir.
 */

export interface TeaRgba {
  r: number
  g: number
  b: number
  /** 0..1 opaklık. */
  a: number
}

interface Stop {
  d: number
  rgb: [number, number, number]
  a: number
}

/** Renk durakları (sRGB). */
export const TEA_STOPS: readonly Stop[] = [
  { d: 0.0, rgb: [248, 236, 204], a: 0.16 }, // neredeyse şeffaf açık kehribar (su)
  { d: 0.1, rgb: [242, 204, 132], a: 0.4 },
  { d: 0.2, rgb: [230, 158, 66], a: 0.62 }, // açık amber
  { d: 0.28, rgb: [216, 112, 36], a: 0.74 },
  { d: 0.35, rgb: [198, 74, 22], a: 0.82 }, // canlı kırmızımsı amber (tavşan kanı)
  { d: 0.43, rgb: [162, 50, 16], a: 0.88 },
  { d: 0.5, rgb: [128, 36, 12], a: 0.92 }, // koyu kızıl kahve
  { d: 0.62, rgb: [92, 27, 10], a: 0.95 },
  { d: 0.75, rgb: [62, 20, 9], a: 0.975 }, // neredeyse opak koyu kahve
  { d: 1.0, rgb: [38, 13, 6], a: 0.99 },
]

const toLinear = (c: number): number => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const toSrgb = (v: number): number => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055
  return Math.round(Math.max(0, Math.min(1, c)) * 255)
}

const LINEAR_STOPS = TEA_STOPS.map((s) => ({
  d: s.d,
  lin: [toLinear(s.rgb[0]), toLinear(s.rgb[1]), toLinear(s.rgb[2])] as [number, number, number],
  a: s.a,
}))

/** Işık yolu etkisiyle efektif dem oranı. */
export function effectiveDem(d: number, pathFactor = 1): number {
  const x = Math.max(0, Math.min(1, d))
  return 1 - (1 - x) ** Math.max(0.1, pathFactor)
}

export function teaColor(d: number, pathFactor = 1): TeaRgba {
  const e = effectiveDem(d, pathFactor)
  let i = 0
  while (i < LINEAR_STOPS.length - 2 && e > (LINEAR_STOPS[i + 1] as (typeof LINEAR_STOPS)[number]).d) i++
  const s0 = LINEAR_STOPS[i] as (typeof LINEAR_STOPS)[number]
  const s1 = LINEAR_STOPS[i + 1] as (typeof LINEAR_STOPS)[number]
  const t = Math.max(0, Math.min(1, (e - s0.d) / (s1.d - s0.d)))
  const k = t
  return {
    r: toSrgb(s0.lin[0] + (s1.lin[0] - s0.lin[0]) * k),
    g: toSrgb(s0.lin[1] + (s1.lin[1] - s0.lin[1]) * k),
    b: toSrgb(s0.lin[2] + (s1.lin[2] - s0.lin[2]) * k),
    a: s0.a + (s1.a - s0.a) * k,
  }
}

/** Göreli parlaklık (0..1). */
export function luminance(c: { r: number; g: number; b: number }): number {
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b)
}

export function rgbToInt(c: { r: number; g: number; b: number }): number {
  return (c.r << 16) | (c.g << 8) | c.b
}

export function rgbToCss(c: TeaRgba): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a.toFixed(3)})`
}

/** dem ve su hacimlerinden dem oranı. Bardak boşsa 0. */
export function demRatio(dem: number, su: number): number {
  const total = dem + su
  return total > 1e-9 ? dem / total : 0
}
