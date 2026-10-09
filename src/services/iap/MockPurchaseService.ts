/**
 * Web ve geliştirme için sahte satın alma servisi.
 * Geliştirici menüsünden başarı, iptal ve hata senaryoları seçilebilir.
 * "Mağaza" tarafındaki kalıcı satın alımlar localStorage'da tutulur (geri yükleme testi için).
 */

import { PRODUCTS, type EntitlementId, type ProductId } from '@/config/products'
import { Listeners } from '../emitter'
import type { PurchaseResult, PurchaseService, RestoreResult, StoreProduct } from './PurchaseService'

export type MockPurchaseScenario = 'success' | 'cancel' | 'error' | 'noPrices'

const STORE_KEY = 'demli-olsun.mockstore'

const MOCK_PRICES: Record<ProductId, string> = {
  remove_ads: '₺129,99',
  starter_pack: '₺79,99',
  theme_rize: '₺49,99',
  theme_bogaz: '₺49,99',
  bahsis_s: '₺29,99',
  bahsis_m: '₺69,99',
  bahsis_l: '₺149,99',
}

const TITLES: Record<ProductId, string> = {
  remove_ads: 'Reklamsız',
  starter_pack: 'Başlangıç Paketi',
  theme_rize: 'Rize çay bahçesi',
  theme_bogaz: 'Boğaz vapuru',
  bahsis_s: 'Küçük kese',
  bahsis_m: 'Orta kese',
  bahsis_l: 'Büyük kese',
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class MockPurchaseService implements PurchaseService {
  readonly kind = 'mock' as const
  scenario: MockPurchaseScenario = 'success'
  private entitlements = new Set<EntitlementId>()
  private readonly listeners = new Listeners<EntitlementId[]>()

  private readStore(): EntitlementId[] {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') as EntitlementId[]
    } catch {
      return []
    }
  }

  private writeStore(e: EntitlementId[]): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(e))
    } catch {
      /* yok say */
    }
  }

  async init(_appUserId: string): Promise<void> {
    await this.refresh()
  }

  async getProducts(): Promise<StoreProduct[]> {
    await wait(150)
    if (this.scenario === 'noPrices') return []
    return PRODUCTS.map((p) => ({ id: p.id, priceString: MOCK_PRICES[p.id], title: TITLES[p.id] }))
  }

  async purchase(id: ProductId): Promise<PurchaseResult> {
    await wait(700)
    if (this.scenario === 'cancel') return { status: 'cancelled' }
    if (this.scenario === 'error') return { status: 'error', message: 'Mock store error' }
    const def = PRODUCTS.find((p) => p.id === id)
    if (def?.entitlement) {
      const store = new Set(this.readStore())
      store.add(def.entitlement)
      this.writeStore([...store])
      this.entitlements.add(def.entitlement)
      this.listeners.emit([...this.entitlements])
    }
    return {
      status: 'success',
      productId: id,
      transactionId: `mock_${id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      entitlements: [...this.entitlements],
    }
  }

  async restore(): Promise<RestoreResult> {
    await wait(500)
    if (this.scenario === 'error') return { status: 'error', message: 'Mock restore error' }
    const e = await this.refresh()
    return { status: 'success', entitlements: e }
  }

  isEntitled(e: EntitlementId): boolean {
    return this.entitlements.has(e)
  }

  async refresh(): Promise<EntitlementId[]> {
    this.entitlements = new Set(this.readStore())
    const list = [...this.entitlements]
    this.listeners.emit(list)
    return list
  }

  /** Geliştirici menüsü: sahte mağazayı sıfırla. */
  clearStore(): void {
    this.writeStore([])
    this.entitlements.clear()
    this.listeners.emit([])
  }

  onEntitlements(fn: (e: EntitlementId[]) => void): () => void {
    return this.listeners.on(fn)
  }
}
