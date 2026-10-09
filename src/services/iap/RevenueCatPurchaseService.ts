/** RevenueCat uygulaması (@revenuecat/purchases-capacitor). Entitlement'ların kaynağı mağazadır. */

import { Capacitor } from '@capacitor/core'
import {
  Purchases,
  PURCHASES_ERROR_CODE,
  PRODUCT_CATEGORY,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesStoreProduct,
} from '@revenuecat/purchases-capacitor'
import { PRODUCTS, type EntitlementId, type ProductId } from '@/config/products'
import { Listeners } from '../emitter'
import { ENTITLEMENT_IDS, type PurchaseResult, type PurchaseService, type RestoreResult, type StoreProduct } from './PurchaseService'

export class RevenueCatPurchaseService implements PurchaseService {
  readonly kind = 'revenuecat' as const
  private configured = false
  private entitlements = new Set<EntitlementId>()
  private products = new Map<ProductId, PurchasesStoreProduct>()
  private readonly listeners = new Listeners<EntitlementId[]>()

  async init(appUserId: string): Promise<void> {
    const key = Capacitor.getPlatform() === 'ios' ? import.meta.env.VITE_REVENUECAT_KEY_IOS : import.meta.env.VITE_REVENUECAT_KEY_ANDROID
    if (!key) {
      console.warn('[iap] RevenueCat anahtarı yok (.env). Satın alma devre dışı.')
      return
    }
    try {
      await Purchases.configure({ apiKey: key, appUserID: appUserId })
      this.configured = true
      await Purchases.addCustomerInfoUpdateListener((info) => this.applyCustomerInfo(info))
      await this.refresh()
    } catch (err) {
      console.warn('[iap] RevenueCat başlatılamadı', err)
    }
  }

  private applyCustomerInfo(info: CustomerInfo): EntitlementId[] {
    const active = Object.keys(info.entitlements.active)
    this.entitlements = new Set(ENTITLEMENT_IDS.filter((e) => active.includes(e)))
    const list = [...this.entitlements]
    this.listeners.emit(list)
    return list
  }

  async getProducts(): Promise<StoreProduct[]> {
    if (!this.configured) return []
    try {
      const { products } = await Purchases.getProducts({
        productIdentifiers: PRODUCTS.map((p) => p.id),
        type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
      })
      const out: StoreProduct[] = []
      for (const p of products) {
        const def = PRODUCTS.find((d) => d.id === p.identifier)
        if (!def) continue
        this.products.set(def.id, p)
        out.push({ id: def.id, priceString: p.priceString, title: p.title })
      }
      return out
    } catch (err) {
      console.warn('[iap] Ürünler alınamadı', err)
      return []
    }
  }

  async purchase(id: ProductId): Promise<PurchaseResult> {
    if (!this.configured) return { status: 'error', message: 'not configured' }
    let product = this.products.get(id)
    if (!product) {
      await this.getProducts()
      product = this.products.get(id)
    }
    if (!product) return { status: 'error', message: 'product not found' }
    try {
      const res = await Purchases.purchaseStoreProduct({ product })
      const entitlements = this.applyCustomerInfo(res.customerInfo)
      return {
        status: 'success',
        productId: id,
        transactionId: res.transaction.transactionIdentifier,
        entitlements,
      }
    } catch (err) {
      const e = err as Partial<PurchasesError>
      if (e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || e.userCancelled) return { status: 'cancelled' }
      return { status: 'error', message: e.message ?? String(err) }
    }
  }

  async restore(): Promise<RestoreResult> {
    if (!this.configured) return { status: 'error', message: 'not configured' }
    try {
      const { customerInfo } = await Purchases.restorePurchases()
      return { status: 'success', entitlements: this.applyCustomerInfo(customerInfo) }
    } catch (err) {
      return { status: 'error', message: (err as Partial<PurchasesError>).message ?? String(err) }
    }
  }

  isEntitled(e: EntitlementId): boolean {
    return this.entitlements.has(e)
  }

  async refresh(): Promise<EntitlementId[]> {
    if (!this.configured) return [...this.entitlements]
    try {
      const { customerInfo } = await Purchases.getCustomerInfo()
      return this.applyCustomerInfo(customerInfo)
    } catch {
      return [...this.entitlements]
    }
  }

  onEntitlements(fn: (e: EntitlementId[]) => void): () => void {
    return this.listeners.on(fn)
  }
}
