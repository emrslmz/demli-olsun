/** Satın alma servisi arayüzü. Tarayıcıda mock, cihazda RevenueCat. */

import type { EntitlementId, ProductId } from '@/config/products'

export interface StoreProduct {
  id: ProductId
  /** Mağazadan gelen yerelleştirilmiş fiyat metni. */
  priceString: string
  title: string
}

export type PurchaseResult =
  | { status: 'success'; productId: ProductId; transactionId: string; entitlements: EntitlementId[] }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

export type RestoreResult = { status: 'success'; entitlements: EntitlementId[] } | { status: 'error'; message: string }

export interface PurchaseService {
  readonly kind: 'revenuecat' | 'mock'
  init(appUserId: string): Promise<void>
  getProducts(): Promise<StoreProduct[]>
  purchase(id: ProductId): Promise<PurchaseResult>
  restore(): Promise<RestoreResult>
  /** Son bilinen entitlement durumu (kaynak mağaza; yerelde önbellek). */
  isEntitled(e: EntitlementId): boolean
  /** Entitlement'ları mağazadan yeniler (açılışta ve ön plana dönüşte). */
  refresh(): Promise<EntitlementId[]>
  onEntitlements(fn: (e: EntitlementId[]) => void): () => void
}

export const ENTITLEMENT_IDS: EntitlementId[] = ['no_ads', 'theme_rize', 'theme_bogaz', 'starter_pack']

/** Kullanıcıya düz bir cümleyle hata anlatımı. */
export function purchaseErrorText(message: string): string {
  if (/network|internet|offline/i.test(message)) {
    return 'İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol edip tekrar dene.'
  }
  if (/not allowed|payment.*not/i.test(message)) {
    return 'Bu cihazda satın alma kapalı. Cihaz ayarlarından satın almaya izin verip tekrar dene.'
  }
  return 'Satın alma tamamlanamadı. Hesabından ücret alınmadı; biraz sonra tekrar dene.'
}
