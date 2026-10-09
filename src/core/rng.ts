/** Seed'li, deterministik rastgele sayı üreteci (string hash + mulberry32). */

/** cyrb53 türevi: string'i 32 bit tam sayıya indirger. */
export function hashString(str: string): number {
  let h1 = 0xdeadbeef ^ str.length
  let h2 = 0x41c6ce57 ^ str.length
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h1 ^ h2) >>> 0
}

/** mulberry32: [0, 1) aralığında sayı üreten fonksiyon döndürür. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private readonly gen: () => number

  constructor(seed: string | number) {
    this.gen = mulberry32(typeof seed === 'number' ? seed >>> 0 : hashString(seed))
  }

  /** [0, 1) */
  next(): number {
    return this.gen()
  }

  /** [min, max) */
  float(min: number, max: number): number {
    return min + (max - min) * this.gen()
  }

  /** [min, max] tam sayı (iki uç dahil). */
  int(min: number, max: number): number {
    return Math.floor(min + (max - min + 1) * this.gen())
  }

  chance(p: number): boolean {
    return this.gen() < p
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: boş dizi')
    return items[Math.floor(this.gen() * items.length)] as T
  }

  /** Ağırlıklı seçim. Ağırlıklar negatif olmamalı. */
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    let total = 0
    for (let i = 0; i < items.length; i++) total += Math.max(0, weights[i] ?? 0)
    if (total <= 0) return this.pick(items)
    let r = this.gen() * total
    for (let i = 0; i < items.length; i++) {
      r -= Math.max(0, weights[i] ?? 0)
      if (r < 0) return items[i] as T
    }
    return items[items.length - 1] as T
  }

  /** Box–Muller ile normal dağılım. */
  normal(mean: number, sd: number): number {
    const u = Math.max(1e-12, this.gen())
    const v = this.gen()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.gen() * (i + 1))
      const tmp = items[i] as T
      items[i] = items[j] as T
      items[j] = tmp
    }
    return items
  }
}

export function createRng(seed: string | number): Rng {
  return new Rng(seed)
}
