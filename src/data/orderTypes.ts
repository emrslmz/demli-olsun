/** Sipariş tipleri (Bölüm 6.1). */

export type TeaTypeId = 'acik' | 'tavsan' | 'demli' | 'koyu'
export type FillTypeId = 'normal' | 'agzina' | 'yarim'

export const TEA_TYPES: Record<TeaTypeId, { name: string; dem: [number, number] }> = {
  acik: { name: 'Açık', dem: [15, 25] },
  tavsan: { name: 'Tavşan kanı', dem: [30, 40] },
  demli: { name: 'Demli', dem: [45, 55] },
  koyu: { name: 'Koyu', dem: [60, 75] },
}

export const FILL_TYPES: Record<FillTypeId, { name: string; fill: [number, number] }> = {
  normal: { name: 'Normal', fill: [80, 88] },
  agzina: { name: 'Ağzına kadar', fill: [93, 96] },
  yarim: { name: 'Yarım', fill: [45, 55] },
}

export const TEA_TYPE_IDS: TeaTypeId[] = ['acik', 'tavsan', 'demli', 'koyu']
export const FILL_TYPE_IDS: FillTypeId[] = ['normal', 'agzina', 'yarim']
