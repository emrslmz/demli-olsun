/**
 * Bardak modeli. Her bardak tipinin iç profili r(h) vardır (h: 0..1, dipten ağza).
 * Açılışta kümülatif hacim tablosu V(h) = ∫ π r(h)² dh çıkarılır; tüm yüzdeler hacim bazlıdır,
 * ekranda görünen seviye ise yüksekliktir. Bel dar olduğunda seviye orada kendiliğinden hızlanır.
 */

export type GlassProfileId = 'ince' | 'duz' | 'kupa' | 'fincan'

export interface GlassDef {
  id: GlassProfileId
  name: string
  /** İç (sıvı) yüksekliğinin ince belli bardağa oranı. */
  height: number
  /** İç profil kontrol noktaları: [h (0..1), r (iç yükseklik birimiyle yarıçap)]. h artan sırada. */
  profile: [number, number][]
  /** Cam/porselen duvar kalınlığı (iç yükseklik birimiyle). */
  wall: number
  /** Dip kalınlığı (iç yükseklik birimiyle). */
  base: number
  /** Işık yolu katsayısı: geniş bardakta çay daha koyu görünür. */
  pathFactor: number
  /** Opak bardakta içi görünmez (porselen fincan). */
  opaque: boolean
  handle: boolean
}

export const GLASS_DEFS: Record<GlassProfileId, GlassDef> = {
  ince: {
    id: 'ince',
    name: 'İnce belli',
    height: 1,
    profile: [
      [0, 0.165],
      [0.06, 0.2],
      [0.18, 0.212],
      [0.3, 0.19],
      [0.4, 0.162],
      [0.52, 0.172],
      [0.68, 0.212],
      [0.85, 0.248],
      [1, 0.272],
    ],
    wall: 0.022,
    base: 0.09,
    pathFactor: 1,
    opaque: false,
    handle: false,
  },
  duz: {
    id: 'duz',
    name: 'Düz bardak',
    height: 0.9,
    profile: [
      [0, 0.205],
      [1, 0.255],
    ],
    wall: 0.024,
    base: 0.08,
    pathFactor: 1.05,
    opaque: false,
    handle: false,
  },
  kupa: {
    id: 'kupa',
    name: 'Kupa',
    height: 0.82,
    profile: [
      [0, 0.34],
      [0.04, 0.36],
      [1, 0.37],
    ],
    wall: 0.04,
    base: 0.07,
    pathFactor: 1.35,
    opaque: false,
    handle: true,
  },
  fincan: {
    id: 'fincan',
    name: 'Porselen fincan',
    height: 0.6,
    profile: [
      [0, 0.2],
      [0.15, 0.3],
      [0.45, 0.37],
      [1, 0.42],
    ],
    wall: 0.04,
    base: 0.06,
    pathFactor: 1.2,
    opaque: true,
    handle: true,
  },
}

/** Fritsch–Carlson monoton kübik interpolasyon: profil kontrol noktaları arasında taşma yapmaz. */
export function createMonotoneSpline(points: [number, number][]): (x: number) => number {
  const n = points.length
  if (n === 0) return () => 0
  if (n === 1) return () => (points[0] as [number, number])[1]
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const d: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    d.push(((ys[i + 1] as number) - (ys[i] as number)) / ((xs[i + 1] as number) - (xs[i] as number)))
  }
  m.push(d[0] as number)
  for (let i = 1; i < n - 1; i++) {
    const a = d[i - 1] as number
    const b = d[i] as number
    m.push(a * b <= 0 ? 0 : (a + b) / 2)
  }
  m.push(d[n - 2] as number)
  for (let i = 0; i < n - 1; i++) {
    const di = d[i] as number
    if (di === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = (m[i] as number) / di
    const b = (m[i + 1] as number) / di
    const s = a * a + b * b
    if (s > 9) {
      const t = 3 / Math.sqrt(s)
      m[i] = t * a * di
      m[i + 1] = t * b * di
    }
  }
  return (x: number) => {
    if (x <= (xs[0] as number)) return ys[0] as number
    if (x >= (xs[n - 1] as number)) return ys[n - 1] as number
    let i = 0
    while (i < n - 2 && x > (xs[i + 1] as number)) i++
    const x0 = xs[i] as number
    const x1 = xs[i + 1] as number
    const h = x1 - x0
    const t = (x - x0) / h
    const t2 = t * t
    const t3 = t2 * t
    const h00 = 2 * t3 - 3 * t2 + 1
    const h10 = t3 - 2 * t2 + t
    const h01 = -2 * t3 + 3 * t2
    const h11 = t3 - t2
    return h00 * (ys[i] as number) + h10 * h * (m[i] as number) + h01 * (ys[i + 1] as number) + h11 * h * (m[i + 1] as number)
  }
}

export interface GlassModel {
  def: GlassDef
  /** Yükseklik (0..1) → yarıçap (iç yükseklik birimi). */
  radiusAt(h: number): number
  /** Yükseklik (0..1) → hacim oranı (0..1). */
  volumeAt(h: number): number
  /** Hacim oranı (0..1) → yükseklik (0..1). 1'in üstü 1'e kırpılır. */
  heightAt(v: number): number
  /** En geniş iç yarıçap. */
  maxRadius: number
  /** Örnek sayısı. */
  samples: number
}

export function createGlassModel(def: GlassDef, samples = 200): GlassModel {
  const r = createMonotoneSpline(def.profile)
  const hs = new Float64Array(samples + 1)
  const cum = new Float64Array(samples + 1)
  let maxRadius = 0
  let prevArea = Math.PI * r(0) ** 2
  maxRadius = Math.max(maxRadius, r(0))
  for (let i = 1; i <= samples; i++) {
    const h = i / samples
    const rad = r(h)
    maxRadius = Math.max(maxRadius, rad)
    const area = Math.PI * rad * rad
    hs[i] = h
    cum[i] = (cum[i - 1] as number) + ((prevArea + area) / 2) * (1 / samples)
    prevArea = area
  }
  const total = cum[samples] as number
  for (let i = 0; i <= samples; i++) cum[i] = (cum[i] as number) / total

  const volumeAt = (h: number): number => {
    if (h <= 0) return 0
    if (h >= 1) return 1
    const f = h * samples
    const i = Math.floor(f)
    const t = f - i
    const a = cum[i] as number
    const b = cum[Math.min(samples, i + 1)] as number
    return a + (b - a) * t
  }

  const heightAt = (v: number): number => {
    if (v <= 0) return 0
    if (v >= 1) return 1
    let lo = 0
    let hi = samples
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if ((cum[mid] as number) < v) lo = mid
      else hi = mid
    }
    const a = cum[lo] as number
    const b = cum[hi] as number
    const t = b > a ? (v - a) / (b - a) : 0
    return (lo + t) / samples
  }

  return { def, radiusAt: r, volumeAt, heightAt, maxRadius, samples }
}

const cache = new Map<GlassProfileId, GlassModel>()

export function getGlassModel(id: GlassProfileId): GlassModel {
  let m = cache.get(id)
  if (!m) {
    m = createGlassModel(GLASS_DEFS[id])
    cache.set(id, m)
  }
  return m
}
