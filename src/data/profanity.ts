/**
 * Basit küfür filtresi. Metin normalize edilir (tr küçük harf, Türkçe harfler ASCII'ye, leetspeak rakamlar harfe,
 * noktalama/boşluk kaldırılır). Uzun kökler alt dize olarak, kısa kökler yalnızca tam kelime olarak eşleşir
 * (ör. "ışık" yanlışlıkla engellenmesin).
 */

const SUBSTRING_ROOTS = [
  'orospu',
  'pezevenk',
  'yarrak',
  'yarak',
  'amcik',
  'amina',
  'aminak',
  'siktir',
  'sikerim',
  'sikeyim',
  'sikik',
  'gotveren',
  'kahpe',
  'serefsiz',
  'kevase',
  'gavat',
  'yavsak',
  'dalyarak',
  'ananiskm',
  'anasini',
]

const EXACT_WORDS = ['amk', 'aq', 'amq', 'oc', 'pic', 'ibne', 'got', 'sik', 'sg', 'mk', 'pust']

const MAP: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  i: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
}

export function normalizeForFilter(text: string): string {
  return [...text.toLocaleLowerCase('tr-TR')].map((c) => MAP[c] ?? c).join('')
}

export function isProfane(text: string): boolean {
  const norm = normalizeForFilter(text)
  const compact = norm.replace(/[^a-z]/g, '')
  if (SUBSTRING_ROOTS.some((r) => compact.includes(r))) return true
  const words = norm.split(/[^a-z]+/).filter(Boolean)
  return words.some((w) => EXACT_WORDS.includes(w))
}

export type NicknameError = 'short' | 'long' | 'chars' | 'bad' | null

/** 3–16 karakter, Türkçe karakter serbest; harf, rakam, boşluk, _ ve -. */
export function validateNickname(raw: string): NicknameError {
  const name = raw.trim()
  const len = [...name].length
  if (len < 3) return 'short'
  if (len > 16) return 'long'
  if (!/^[\p{L}\p{N} _-]+$/u.test(name)) return 'chars'
  if (isProfane(name)) return 'bad'
  return null
}
