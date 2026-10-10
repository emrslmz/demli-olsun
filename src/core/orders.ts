/** Sipariş üretimi (Bölüm 6). Seed'li RNG ile deterministik. */

import { SUGAR, type StageConfig } from '@/config/gameplay'
import { CUSTOMERS, CUSTOMER_IDS, type CustomerId } from '@/data/customers'
import { FILL_TYPES, FILL_TYPE_IDS, TEA_TYPES, TEA_TYPE_IDS, type FillTypeId, type TeaTypeId } from '@/data/orderTypes'
import { orderPatience } from './difficulty'
import type { Rng } from './rng'

export interface Order {
  id: number
  customer: CustomerId
  teaType: TeaTypeId
  /** Hedef dem yüzdesi (tam sayı). */
  demTarget: number
  fillType: FillTypeId
  /** Hedef doluluk yüzdesi (tam sayı, şeker dahil son hacim). */
  fillTarget: number
  sugar: number
  /** Toplam sabır (sn). */
  patience: number
}

export interface OrderContext {
  served: number
  stage: StageConfig
  nextId: number
  lastCustomer?: CustomerId
  /** Bu müşterileri hariç tut (ör. eğitim). */
  exclude?: CustomerId[]
}

export function pickCustomer(rng: Rng, ctx: OrderContext): CustomerId {
  const ids = CUSTOMER_IDS.filter((id) => CUSTOMERS[id].minStage <= ctx.stage.stage && !(ctx.exclude ?? []).includes(id))
  const weights = ids.map((id) => CUSTOMERS[id].weight * (id === ctx.lastCustomer ? 0.3 : 1))
  return rng.weighted(ids, weights)
}

export function pickTeaType(rng: Rng, customer: CustomerId): TeaTypeId {
  const w = CUSTOMERS[customer].teaWeights
  return rng.weighted(
    TEA_TYPE_IDS,
    TEA_TYPE_IDS.map((t) => w[t]),
  )
}

export function pickFillType(rng: Rng, customer: CustomerId): FillTypeId {
  const w = CUSTOMERS[customer].fillWeights
  return rng.weighted(
    FILL_TYPE_IDS,
    FILL_TYPE_IDS.map((t) => w[t]),
  )
}

export function pickSugar(rng: Rng, chance: number): number {
  if (!rng.chance(chance)) return 0
  return rng.weighted([1, 2, 3], SUGAR.countWeights)
}

export function generateOrder(rng: Rng, ctx: OrderContext): Order {
  const customer = pickCustomer(rng, ctx)
  const def = CUSTOMERS[customer]
  const teaType = pickTeaType(rng, customer)
  const fillType = pickFillType(rng, customer)
  const [d0, d1] = TEA_TYPES[teaType].dem
  const [f0, f1] = FILL_TYPES[fillType].fill
  return {
    id: ctx.nextId,
    customer,
    teaType,
    demTarget: rng.int(d0, d1),
    fillType,
    fillTarget: rng.int(f0, f1),
    sugar: pickSugar(rng, ctx.stage.sugarChance),
    patience: orderPatience(ctx.served, def.patienceFactor),
  }
}
