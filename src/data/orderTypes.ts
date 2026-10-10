/** Sipariş tipleri (Bölüm 6.1). Adlar dil dosyasında (tr.tea, tr.fill). */

import { tr } from '@/i18n/tr'

export type TeaTypeId = 'acik' | 'tavsan' | 'demli' | 'koyu'
export type FillTypeId = 'normal' | 'agzina' | 'yarim'

export const TEA_TYPES: Record<TeaTypeId, { dem: [number, number] }> = {
  acik: { dem: [15, 25] },
  tavsan: { dem: [30, 40] },
  demli: { dem: [45, 55] },
  koyu: { dem: [60, 75] },
}

/**
 * Doluluk tipleri sabit seviyelerdir (bardakta çizgi yok; oyuncu balondaki örnek bardağa ve bardağın şekline bakar):
 * yarım ≈ belin hizası, normal ≈ ağzın biraz altı, ağzına kadar ≈ dudağın hemen altı.
 */
export const FILL_TYPES: Record<FillTypeId, { fill: [number, number] }> = {
  normal: { fill: [84, 84] },
  agzina: { fill: [95, 95] },
  yarim: { fill: [50, 50] },
}

export const TEA_TYPE_IDS: TeaTypeId[] = ['acik', 'tavsan', 'demli', 'koyu']
export const FILL_TYPE_IDS: FillTypeId[] = ['normal', 'agzina', 'yarim']

export function teaName(id: TeaTypeId): string {
  return tr.tea[id]
}

export function fillName(id: FillTypeId): string {
  return tr.fill[id]
}
