/** Kozmetikler: bardak skinleri, demlik takımları, mekanlar. Oynanışa dokunmazlar. Adlar dil dosyasında. */

import type { EntitlementId } from '@/config/products'
import { VENUE_SAHIL_PRICE } from '@/config/economy'
import { tr } from '@/i18n/tr'

export type CosmeticKind = 'glass' | 'pot' | 'venue'

export interface GlassSkin {
  id: string
  /** null: çarşıda satılmaz (ör. Başlangıç Paketi bardağı). */
  price: number | null
  /** Bardağa sarılan desen görseli. */
  decal: string | null
  /** Cam kontur rengi. */
  outline: string
  /** Cam rengi ve opaklığı. */
  glass: string
  glassAlpha: number
  /** Ağız kenarı rengi. */
  rim: string
  /** Biçim (kozmetik, oynanışı değiştirmez): sağda cam kulp, dikey yivler (faset), metal zarf. */
  handle?: boolean
  facets?: boolean
  holder?: 'zarf'
}

export const GLASS_SKINS: GlassSkin[] = [
  { id: 'klasik', price: 0, decal: null, outline: '#3B2416', glass: '#EAF6F8', glassAlpha: 0.22, rim: '#FFFFFF' },
  {
    id: 'nazar',
    price: 300,
    decal: 'decal_nazar',
    outline: '#3B2416',
    glass: '#E6F2FA',
    glassAlpha: 0.22,
    rim: '#FFFFFF',
  },
  {
    id: 'lale',
    price: 450,
    decal: 'decal_lale',
    outline: '#3B2416',
    glass: '#EAF6F8',
    glassAlpha: 0.22,
    rim: '#FFFFFF',
  },
  {
    id: 'kulplu',
    price: 600,
    decal: null,
    outline: '#3B2416',
    glass: '#EAF6F8',
    glassAlpha: 0.22,
    rim: '#FFFFFF',
    handle: true,
  },
  {
    id: 'yaldiz',
    price: 700,
    decal: 'decal_yaldiz',
    outline: '#3B2416',
    glass: '#FFF6E0',
    glassAlpha: 0.2,
    rim: '#E3B83F',
  },
  {
    id: 'firuze',
    price: 900,
    decal: null,
    outline: '#1E4E55',
    glass: '#7FD8D6',
    glassAlpha: 0.32,
    rim: '#E2B33C',
  },
  {
    id: 'tirtikli',
    price: 1100,
    decal: null,
    outline: '#3B2416',
    glass: '#EEF7FB',
    glassAlpha: 0.26,
    rim: '#FFFFFF',
    facets: true,
  },
  {
    id: 'kristal',
    price: 1500,
    decal: 'decal_kristal',
    outline: '#2B3A4A',
    glass: '#F2FBFF',
    glassAlpha: 0.3,
    rim: '#FFFFFF',
  },
  {
    id: 'zarf',
    price: 2200,
    decal: null,
    outline: '#3B2416',
    glass: '#EAF6F8',
    glassAlpha: 0.22,
    rim: '#FFFFFF',
    holder: 'zarf',
  },
  {
    id: 'baslangic',
    price: null,
    decal: 'decal_baslangic',
    outline: '#3B2416',
    glass: '#EEF8EC',
    glassAlpha: 0.22,
    rim: '#C9A227',
  },
]

export interface PotSkin {
  id: string
  price: number
}

export const POT_SKINS: PotSkin[] = [
  { id: 'celik', price: 0 },
  { id: 'emaye', price: 400 },
  { id: 'porselen', price: 900 },
  { id: 'bakir', price: 2000 },
]

export interface Venue {
  id: string
  /** Bahşiş fiyatı; premium mekanlarda null. */
  price: number | null
  entitlement: EntitlementId | null
}

export const VENUES: Venue[] = [
  { id: 'mahalle', price: 0, entitlement: null },
  { id: 'yayla', price: 1500, entitlement: null },
  { id: 'kapadokya', price: 2000, entitlement: null },
  { id: 'sahil', price: VENUE_SAHIL_PRICE, entitlement: null },
  { id: 'galata', price: 2500, entitlement: null },
  { id: 'rize', price: null, entitlement: 'theme_rize' },
  { id: 'bogaz', price: null, entitlement: 'theme_bogaz' },
]

export function glassSkin(id: string): GlassSkin {
  return GLASS_SKINS.find((g) => g.id === id) ?? (GLASS_SKINS[0] as GlassSkin)
}

export function potSkin(id: string): PotSkin {
  return POT_SKINS.find((p) => p.id === id) ?? (POT_SKINS[0] as PotSkin)
}

export function venue(id: string): Venue {
  return VENUES.find((v) => v.id === id) ?? (VENUES[0] as Venue)
}

/** Kozmetiğin aktif dildeki adı. */
export function cosmeticName(kind: CosmeticKind, id: string): string {
  const table: Record<string, string> = kind === 'glass' ? tr.glasses : kind === 'pot' ? tr.pots : tr.venues
  return table[id] ?? id
}
