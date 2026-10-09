/** Kozmetikler: bardak skinleri, demlik takımları, mekanlar. Oynanışa dokunmazlar. */

import type { EntitlementId } from '@/config/products'
import { VENUE_SAHIL_PRICE } from '@/config/economy'

export type CosmeticKind = 'glass' | 'pot' | 'venue'

export interface GlassSkin {
  id: string
  name: string
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
}

export const GLASS_SKINS: GlassSkin[] = [
  { id: 'klasik', name: 'Klasik', price: 0, decal: null, outline: '#3B2416', glass: '#EAF6F8', glassAlpha: 0.22, rim: '#FFFFFF' },
  { id: 'nazar', name: 'Nazar boncuklu', price: 300, decal: 'decal_nazar', outline: '#3B2416', glass: '#E6F2FA', glassAlpha: 0.22, rim: '#FFFFFF' },
  { id: 'lale', name: 'Lale desenli', price: 450, decal: 'decal_lale', outline: '#3B2416', glass: '#EAF6F8', glassAlpha: 0.22, rim: '#FFFFFF' },
  { id: 'yaldiz', name: 'Altın yaldızlı', price: 700, decal: 'decal_yaldiz', outline: '#3B2416', glass: '#FFF6E0', glassAlpha: 0.2, rim: '#E3B83F' },
  { id: 'kristal', name: 'Kristal', price: 1500, decal: 'decal_kristal', outline: '#2B3A4A', glass: '#F2FBFF', glassAlpha: 0.3, rim: '#FFFFFF' },
  { id: 'baslangic', name: 'Başlangıç', price: null, decal: 'decal_baslangic', outline: '#3B2416', glass: '#EEF8EC', glassAlpha: 0.22, rim: '#C9A227' },
]

export interface PotSkin {
  id: string
  name: string
  price: number
}

export const POT_SKINS: PotSkin[] = [
  { id: 'celik', name: 'Çelik', price: 0 },
  { id: 'emaye', name: 'Emaye çiçekli', price: 400 },
  { id: 'porselen', name: 'Porselen', price: 900 },
  { id: 'bakir', name: 'Bakır', price: 2000 },
]

export interface Venue {
  id: string
  name: string
  /** Bahşiş fiyatı; premium mekanlarda null. */
  price: number | null
  entitlement: EntitlementId | null
}

export const VENUES: Venue[] = [
  { id: 'mahalle', name: 'Mahalle kahvesi', price: 0, entitlement: null },
  { id: 'sahil', name: 'Sahil çay bahçesi', price: VENUE_SAHIL_PRICE, entitlement: null },
  { id: 'rize', name: 'Rize çay bahçesi', price: null, entitlement: 'theme_rize' },
  { id: 'bogaz', name: 'Boğaz vapuru', price: null, entitlement: 'theme_bogaz' },
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
