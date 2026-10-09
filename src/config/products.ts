/** Uygulama içi satın alma ürünleri. Fiyatlar koda yazılmaz; mağazadan yerelleştirilmiş metin gelir. */

export type ProductId =
  | 'remove_ads'
  | 'starter_pack'
  | 'theme_rize'
  | 'theme_bogaz'
  | 'bahsis_s'
  | 'bahsis_m'
  | 'bahsis_l'

export type EntitlementId = 'no_ads' | 'theme_rize' | 'theme_bogaz' | 'starter_pack'

export interface ProductDef {
  id: ProductId
  type: 'nonConsumable' | 'consumable'
  /** Kalıcı ürünün açtığı entitlement. */
  entitlement?: EntitlementId
  /** Tüketilebilir üründe eklenen bahşiş. */
  tips?: number
}

export const PRODUCTS: ProductDef[] = [
  { id: 'remove_ads', type: 'nonConsumable', entitlement: 'no_ads' },
  { id: 'starter_pack', type: 'nonConsumable', entitlement: 'starter_pack' },
  { id: 'theme_rize', type: 'nonConsumable', entitlement: 'theme_rize' },
  { id: 'theme_bogaz', type: 'nonConsumable', entitlement: 'theme_bogaz' },
  { id: 'bahsis_s', type: 'consumable', tips: 500 },
  { id: 'bahsis_m', type: 'consumable', tips: 1500 },
  { id: 'bahsis_l', type: 'consumable', tips: 4000 },
]

export function productDef(id: ProductId): ProductDef {
  const p = PRODUCTS.find((x) => x.id === id)
  if (!p) throw new Error(`Bilinmeyen ürün: ${id}`)
  return p
}

export const FORCE_MOCK_IAP = import.meta.env.VITE_FORCE_MOCK_IAP === 'true'

/** RevenueCat offering kimliği (SETUP.md'de oluşturulur). */
export const RC_OFFERING_ID = 'default'
