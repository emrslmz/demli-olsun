/** Müşteriler ve kaprisleri (Bölüm 6.2). */

import type { FillTypeId, TeaTypeId } from './orderTypes'

export type CustomerId = 'riza' | 'muhtar' | 'taksici' | 'ogrenci' | 'esnaf'
export type Expression = 'neutral' | 'happy' | 'angry'

export interface CustomerDef {
  id: CustomerId
  name: string
  /** Kartta görünen kısa ad. */
  short: string
  /** Bardak başı bahşiş. */
  tip: number
  /** Sabır çarpanı. */
  patienceFactor: number
  teaWeights: Record<TeaTypeId, number>
  fillWeights: Record<FillTypeId, number>
  /** Bu aşamadan önce gelmez. */
  minStage: number
  /** Gelme ağırlığı. */
  weight: number
  /** Kaprisin kısa açıklaması (eğitim/çarşı metinleri için). */
  trait: string
}

export const CUSTOMERS: Record<CustomerId, CustomerDef> = {
  riza: {
    id: 'riza',
    name: 'Rıza Amca',
    short: 'Rıza Amca',
    tip: 6,
    patienceFactor: 1,
    teaWeights: { acik: 0.08, tavsan: 0.7, demli: 0.17, koyu: 0.05 },
    fillWeights: { normal: 0.75, agzina: 0.2, yarim: 0.05 },
    minStage: 1,
    weight: 1.2,
    trait: 'Tavşan kanı sever, üç yıldızın altını beğenmez.',
  },
  muhtar: {
    id: 'muhtar',
    name: 'Muhtar',
    short: 'Muhtar',
    tip: 12,
    patienceFactor: 1,
    teaWeights: { acik: 0, tavsan: 0, demli: 0.55, koyu: 0.45 },
    fillWeights: { normal: 0.6, agzina: 0.35, yarim: 0.05 },
    minStage: 1,
    weight: 1,
    trait: 'Demli ya da koyu ister, taşmaya ekstra kızar.',
  },
  taksici: {
    id: 'taksici',
    name: 'Taksici',
    short: 'Taksici',
    tip: 10,
    patienceFactor: 0.6,
    teaWeights: { acik: 0.2, tavsan: 0.35, demli: 0.3, koyu: 0.15 },
    fillWeights: { normal: 0.7, agzina: 0.2, yarim: 0.1 },
    minStage: 2,
    weight: 1,
    trait: 'Acelesi var: sabrı %40 daha kısa.',
  },
  ogrenci: {
    id: 'ogrenci',
    name: 'Üniversiteli',
    short: 'Üniversiteli',
    tip: 4,
    patienceFactor: 1,
    teaWeights: { acik: 0.8, tavsan: 0.2, demli: 0, koyu: 0 },
    fillWeights: { normal: 0.35, agzina: 0, yarim: 0.65 },
    minStage: 1,
    weight: 1,
    trait: 'Açık çay, çoğunlukla yarım bardak.',
  },
  esnaf: {
    id: 'esnaf',
    name: 'Esnaf Ayten Abla',
    short: 'Ayten Abla',
    tip: 8,
    patienceFactor: 1,
    teaWeights: { acik: 0.2, tavsan: 0.4, demli: 0.4, koyu: 0 },
    fillWeights: { normal: 0.9, agzina: 0.1, yarim: 0 },
    minStage: 5,
    weight: 0.9,
    trait: 'Dükkâna tepsiyle 3–4 bardak götürür.',
  },
}

export const CUSTOMER_IDS: CustomerId[] = ['riza', 'muhtar', 'taksici', 'ogrenci', 'esnaf']

export function customerImageId(id: CustomerId, expr: Expression): string {
  return `char_${id}_${expr}`
}
