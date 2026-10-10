/**
 * Arayüz metinleri ve dile duyarlı biçimlendirme.
 *
 * `tr` aktif dildeki metinlerdir ("translations"); reaktif bir nesnedir ve dil değişince yerinde güncellenir,
 * böylece açık Vue ekranları anında yeni dile geçer. Phaser sahneleri metni oluşturulurken okur (dil yalnızca
 * menüden/ayarlardan değişir). Diller: src/i18n/locales/ (tr varsayılan, en). Yeni dil: aynı yapıda bir dosya
 * ekleyip TABLE ve LANGS'e kaydet.
 * Büyük/küçük harf dönüşümlerinde HER ZAMAN upper()/lower() kullan (Türkçe İ/ı için).
 */

import { reactive, ref } from 'vue'
import { enStrings } from './locales/en'
import { trStrings, type Strings } from './locales/tr'

export type { Strings }
export type Lang = 'tr' | 'en'

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'English' },
]

const TABLE: Record<Lang, Strings> = { tr: trStrings, en: enStrings }

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

/** Kaynağı hedefe yerinde kopyalar (dizi ve yaprak değerler değiştirilir, nesneler özyinelemeli). */
function assignDeep(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(source)) {
    const cur = target[k]
    if (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur)) {
      assignDeep(cur as Record<string, unknown>, v as Record<string, unknown>)
    } else {
      target[k] = Array.isArray(v) ? [...v] : v
    }
  }
}

/** Aktif dildeki metinler (reaktif). */
export const tr: Strings = reactive(clone(trStrings)) as Strings

/** Aktif dil. */
export const lang = ref<Lang>('tr')

const LOCALE: Record<Lang, string> = { tr: 'tr-TR', en: 'en-US' }

/** Cihaz dili Türkçe ise tr, değilse en. */
export function detectLanguage(): Lang {
  const nav = typeof navigator !== 'undefined' ? (navigator.languages?.[0] ?? navigator.language ?? '') : ''
  return nav.toLowerCase().startsWith('tr') ? 'tr' : 'en'
}

export function setLanguage(l: Lang): void {
  lang.value = l
  assignDeep(tr as unknown as Record<string, unknown>, clone(TABLE[l]) as unknown as Record<string, unknown>)
  nfCache.clear()
  if (typeof document !== 'undefined') document.documentElement.lang = l
}

/** Belirli bir dilin metinleri (ör. testler, paylaşım). */
export function stringsFor(l: Lang): Strings {
  return TABLE[l]
}

const nfCache = new Map<string, Intl.NumberFormat>()
function nf(digits: number): Intl.NumberFormat {
  const key = `${lang.value}:${digits}`
  let f = nfCache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(LOCALE[lang.value], { minimumFractionDigits: digits, maximumFractionDigits: digits })
    nfCache.set(key, f)
  }
  return f
}

/** Basit yer tutucu doldurma: t('Dem %{n}', { n: 35 }). */
export function fmt(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
}

/**
 * Sayıdan sonra gelen iyelik + ayrılma eki (3. tekil): 20 → "sinden", 30 → "undan", 4 → "ünden".
 * Ünlü uyumu sayının okunuşundaki son kelimeye göre belirlenir.
 */
export function possessiveAblative(n: number): string {
  const v = Math.abs(Math.round(n))
  const ones = ['ından', 'inden', 'sinden', 'ünden', 'ünden', 'inden', 'sından', 'sinden', 'inden', 'undan']
  const tens = ['', 'undan', 'sinden', 'undan', 'ından', 'sinden', 'ından', 'inden', 'inden', 'ından']
  if (v === 0) return 'ından'
  if (v % 1000 === 0) return 'inden'
  if (v % 100 === 0) return 'ünden'
  if (v % 10 !== 0) return ones[v % 10] as string
  return tens[Math.floor(v / 10) % 10] as string
}

export function upper(s: string): string {
  return s.toLocaleUpperCase(LOCALE[lang.value])
}

export function lower(s: string): string {
  return s.toLocaleLowerCase(LOCALE[lang.value])
}

/** Tam sayı, binlik ayraçlı (tr: 1.500, en: 1,500). */
export function num(n: number): string {
  return nf(0).format(Math.round(n))
}

/** Tek ondalıklı sayı (tr: 35,0, en: 35.0). */
export function pct1(n: number): string {
  return nf(1).format(n)
}

/** Ondalık sayı (ör. kombo çarpanı: tr 1,5 / en 1.5). */
export function dec(n: number, digits = 1): string {
  return nf(digits).format(n)
}

/** Tek ondalıklı yüzde: tr %35,0 / en 35.0% */
export function pct(n: number): string {
  return lang.value === 'tr' ? `%${pct1(n)}` : `${pct1(n)}%`
}

/** Tam sayı yüzde: tr %35 / en 35% */
export function pctInt(n: number): string {
  const v = Math.round(n)
  return lang.value === 'tr' ? `%${v}` : `${v}%`
}

/** Şeker: "şekersiz" / "2 şeker" (dilin tekil-çoğul kuralıyla). */
export function sugarText(n: number): string {
  if (n <= 0) return tr.sugar.none
  return fmt(n === 1 ? tr.sugar.one : tr.sugar.many, { n })
}

/** tr: 3 sa 12 dk / 12 dk 05 sn · en: 3h 12m / 12m 05s */
export function duration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const p2 = (v: number) => String(v).padStart(2, '0')
  if (lang.value === 'en') {
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${p2(m)}m`
    return `${m}m ${p2(sec)}s`
  }
  if (d > 0) return `${d} g ${h} sa`
  if (h > 0) return `${h} sa ${p2(m)} dk`
  return `${m} dk ${p2(sec)} sn`
}
