import { afterEach, describe, expect, it } from 'vitest'
import { CUSTOMER_IDS } from '@/data/customers'
import { pickLine, type LineBucket } from '@/data/lines'
import { duration, num, pct, pctInt, setLanguage, stringsFor, sugarText, tr, type Lang } from '@/i18n/tr'

type Tree = { [k: string]: Tree | string | string[] }

/** Yaprak yolları → değer. */
function leaves(t: Tree, prefix = ''): Map<string, string | string[]> {
  const out = new Map<string, string | string[]>()
  for (const [k, v] of Object.entries(t)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string' || Array.isArray(v)) out.set(p, v)
    else for (const [kk, vv] of leaves(v, p)) out.set(kk, vv)
  }
  return out
}

const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .filter((k) => k !== 'sfx')
    .sort()
    .join(',')

const BUCKETS: LineBucket[] = ['p95', 'p85', 'p70', 'p50', 'reject', 'overflow', 'impatient', 'left']

describe('i18n', () => {
  afterEach(() => setLanguage('tr'))

  it('Türkçe ve İngilizce aynı anahtarlara ve aynı yer tutuculara sahip', () => {
    const a = leaves(stringsFor('tr') as unknown as Tree)
    const b = leaves(stringsFor('en') as unknown as Tree)
    expect([...b.keys()].sort()).toEqual([...a.keys()].sort())
    for (const [k, v] of a) {
      const w = b.get(k)
      if (typeof v === 'string') {
        expect(typeof w, k).toBe('string')
        expect((w as string).length, k).toBeGreaterThan(0)
        expect(placeholders(w as string), k).toBe(placeholders(v))
      } else {
        expect(Array.isArray(w), k).toBe(true)
        expect((w as string[]).length, k).toBeGreaterThan(0)
      }
    }
  })

  it('her dilde her müşterinin her durum için en az 4 repliği var', () => {
    for (const l of ['tr', 'en'] as Lang[]) {
      const s = stringsFor(l)
      for (const c of CUSTOMER_IDS) for (const b of BUCKETS) expect(s.lines[c][b].length, `${l}.${c}.${b}`).toBeGreaterThanOrEqual(4)
    }
  })

  it('dil değişince metinler ve replikler yerinde değişir', () => {
    expect(tr.menu.startShift).toBe('Mesaiye başla')
    setLanguage('en')
    expect(tr.menu.startShift).toBe('Start shift')
    expect(stringsFor('en').lines.riza.p95).toContain(pickLine('riza', 'p95', () => 0))
    setLanguage('tr')
    expect(tr.menu.startShift).toBe('Mesaiye başla')
    expect(stringsFor('tr').lines.riza.p95).toContain(pickLine('riza', 'p95', () => 0))
  })

  it('sayı, yüzde ve süre biçimi dile göre', () => {
    expect(num(1500)).toBe('1.500')
    expect(pct(35)).toBe('%35,0')
    expect(pctInt(84)).toBe('%84')
    expect(duration((3 * 3600 + 5 * 60) * 1000)).toBe('3 sa 05 dk')
    expect(sugarText(0)).toBe('şekersiz')
    expect(sugarText(2)).toBe('2 şeker')
    setLanguage('en')
    expect(num(1500)).toBe('1,500')
    expect(pct(35)).toBe('35.0%')
    expect(pctInt(84)).toBe('84%')
    expect(duration((3 * 3600 + 5 * 60) * 1000)).toBe('3h 05m')
    expect(sugarText(1)).toBe('1 sugar')
    expect(sugarText(2)).toBe('2 sugars')
  })
})
