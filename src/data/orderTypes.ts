/** Sipariş tipleri (Bölüm 6.1). */

export type TeaTypeId = 'acik' | 'tavsan' | 'demli' | 'koyu'
export type FillTypeId = 'normal' | 'agzina' | 'yarim'

export const TEA_TYPES: Record<TeaTypeId, { name: string; dem: [number, number] }> = {
  acik: { name: 'Açık', dem: [15, 25] },
  tavsan: { name: 'Tavşan kanı', dem: [30, 40] },
  demli: { name: 'Demli', dem: [45, 55] },
  koyu: { name: 'Koyu', dem: [60, 75] },
}

/**
 * Doluluk tipleri sabit seviyelerdir (bardakta çizgi yok; oyuncu balondaki örnek bardağa ve bardağın şekline bakar):
 * yarım ≈ belin hizası, normal ≈ ağzın biraz altı, ağzına kadar ≈ dudağın hemen altı.
 */
export const FILL_TYPES: Record<FillTypeId, { name: string; fill: [number, number] }> = {
  normal: { name: 'Normal', fill: [84, 84] },
  agzina: { name: 'Ağzına kadar', fill: [95, 95] },
  yarim: { name: 'Yarım', fill: [50, 50] },
}

export const TEA_TYPE_IDS: TeaTypeId[] = ['acik', 'tavsan', 'demli', 'koyu']
export const FILL_TYPE_IDS: FillTypeId[] = ['normal', 'agzina', 'yarim']
