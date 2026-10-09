import { describe, expect, it } from 'vitest'
import { isProfane, validateNickname } from '@/data/profanity'

describe('takma ad', () => {
  it('3–16 karakter, Türkçe karakter serbest', () => {
    expect(validateNickname('Çaycı42')).toBeNull()
    expect(validateNickname('Işık Öğretmen')).toBeNull()
    expect(validateNickname('İŞ_ÇĞÜ-ö')).toBeNull()
    expect(validateNickname('ab')).toBe('short')
    expect(validateNickname('  ab  ')).toBe('short')
    expect(validateNickname('a'.repeat(17))).toBe('long')
    expect(validateNickname('çay☕')).toBe('chars')
    expect(validateNickname('a<b>c')).toBe('chars')
  })

  it('küfür filtresi; masum kelimeler geçer', () => {
    expect(isProfane('s1kt1r')).toBe(true)
    expect(isProfane('Or0spu')).toBe(true)
    expect(isProfane('amk')).toBe(true)
    expect(validateNickname('amk ya')).toBe('bad')
    // Yanlış pozitif olmamalı
    expect(isProfane('Işık')).toBe(false)
    expect(isProfane('Sıkıntı')).toBe(false)
    expect(isProfane('Sikke')).toBe(false)
    expect(isProfane('Amasya')).toBe(false)
    expect(isProfane('Göktürk')).toBe(false)
  })
})
