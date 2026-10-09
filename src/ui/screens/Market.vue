<script setup lang="ts">
/**
 * Çarşı: üst yarıda canlı önizleme (Phaser ortam sahnesi tezgaha iner), altta sekmeli vitrin.
 * Karta dokunmak önizler, alttaki buton alır ya da kullanır. Kese sekmesinde gerçek para ürünleri.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { bus } from '@/bus'
import { buyProduct, restorePurchases } from '@/app/flow'
import {
  buyBooster,
  buyCosmetic,
  cosmeticPrice,
  equipCosmetic,
  freeBoostersLeft,
  freeBoosterViaAd,
  hasCosmetic,
  starterOfferActive,
  starterOfferEndsAt,
  type MarketTab,
} from '@/app/market'
import { now as clockNow } from '@/app/clock'
import { BOOSTERS, type BoosterId } from '@/config/economy'
import type { ProductId } from '@/config/products'
import { GLASS_SKINS, POT_SKINS, VENUES, type CosmeticKind } from '@/data/cosmetics'
import { duration, fmt, num, tr } from '@/i18n/tr'
import { services } from '@/services'
import type { StoreProduct } from '@/services/iap/PurchaseService'
import { ThemeService } from '@/services/theme/ThemeService'
import { useAppStore } from '@/stores/app'
import { useEconomyStore } from '@/stores/economy'
import { useInventoryStore } from '@/stores/inventory'
import GameButton from '@/ui/components/GameButton.vue'
import GlassThumb from '@/ui/components/GlassThumb.vue'
import TopBar from '@/ui/components/TopBar.vue'

const props = withDefaults(defineProps<{ initialTab?: MarketTab }>(), { initialTab: 'glasses' })
const app = useAppStore()
const econ = useEconomyStore()
const inv = useInventoryStore()

const tabs: { id: MarketTab; label: string }[] = [
  { id: 'glasses', label: tr.market.tabs.glasses },
  { id: 'pots', label: tr.market.tabs.pots },
  { id: 'venues', label: tr.market.tabs.venues },
  { id: 'boosters', label: tr.market.tabs.boosters },
  { id: 'shop', label: tr.market.tabs.shop },
]
const tab = ref<MarketTab>(props.initialTab)
const selected = ref<{ kind: CosmeticKind; id: string } | null>(null)
const products = ref<StoreProduct[] | null>(null)
const productsFailed = ref(false)
const tick = ref(clockNow().getTime())
let timer = 0

interface Card {
  kind: CosmeticKind
  id: string
  name: string
  price: number | null
  product: ProductId | null
  owned: boolean
  equipped: boolean
  note?: string
}

const cards = computed<Card[]>(() => {
  void inv.owned
  void app.entitlements
  if (tab.value === 'glasses') {
    return GLASS_SKINS.filter((g) => g.price !== null || inv.isOwned('glass', g.id)).map((g) => card('glass', g.id, g.name, null))
  }
  if (tab.value === 'pots') return POT_SKINS.map((p) => card('pot', p.id, p.name, null))
  if (tab.value === 'venues') {
    return VENUES.map((v) => card('venue', v.id, v.name, v.entitlement ? (v.entitlement as ProductId) : null))
  }
  return []
})

function card(kind: CosmeticKind, id: string, name: string, product: ProductId | null): Card {
  return {
    kind,
    id,
    name,
    price: cosmeticPrice(kind, id),
    product,
    owned: hasCosmetic(kind, id),
    equipped: inv.equipped[kind] === id,
  }
}

function thumb(c: Card): string {
  if (c.kind === 'pot') return ThemeService.url(`pot_demlik_${c.id}`)
  if (c.kind === 'venue') return ThemeService.url(`bg_${c.id}_phone`)
  return ''
}

function priceOf(id: ProductId): string | null {
  return products.value?.find((p) => p.id === id)?.priceString ?? null
}

function select(c: Card) {
  selected.value = { kind: c.kind, id: c.id }
  bus.emit('cosmetic:preview', { kind: c.kind, id: c.id })
}

function act(c: Card) {
  select(c)
  if (c.equipped) return
  if (c.owned) {
    equipCosmetic(c.kind, c.id)
    return
  }
  if (c.product) {
    void buyProduct(c.product)
    return
  }
  if (c.price === null) return
  if (!econ.canAfford(c.price)) {
    app.showToast(`${tr.common.notEnoughTips}. Mesaide biraz daha bahşiş topla ya da Kese'ye bak.`)
    return
  }
  if (buyCosmetic(c.kind, c.id)) app.showToast(`${c.name}: ${tr.market.bought}`)
}

function cardAction(c: Card): { label: string; variant: 'default' | 'primary' | 'accent' | 'metal'; coin: boolean; disabled: boolean } {
  if (c.equipped) return { label: tr.common.equipped, variant: 'default', coin: false, disabled: true }
  if (c.owned) return { label: tr.common.equip, variant: 'accent', coin: false, disabled: false }
  if (c.product) {
    const p = priceOf(c.product)
    return {
      label: p ?? (products.value ? tr.common.priceUnavailable : tr.common.loading),
      variant: 'metal',
      coin: false,
      disabled: !p || app.purchaseBusy,
    }
  }
  if (c.price === null) return { label: tr.starter.title, variant: 'default', coin: false, disabled: true }
  return { label: num(c.price), variant: 'primary', coin: true, disabled: false }
}

// ---------- Güçlendiriciler ----------

const boosterIds: BoosterId[] = ['ustaGozu', 'sabirTasi', 'yedekBardak']
const boosterIcons: Record<BoosterId, string> = { ustaGozu: 'icon_info', sabirTasi: 'icon_clock', yedekBardak: 'icon_life' }
const freeLeft = computed(() => {
  void app.ads
  void tick.value
  return freeBoostersLeft()
})
const adBusy = ref(false)

function buyB(id: BoosterId) {
  if (!buyBooster(id)) app.showToast(tr.common.notEnoughTips)
}

async function freeB(id: BoosterId) {
  if (adBusy.value) return
  adBusy.value = true
  try {
    if (await freeBoosterViaAd(id)) app.showToast(`${tr.boosters[id]} +1`)
  } finally {
    adBusy.value = false
  }
}

// ---------- Kese ----------

const starterActive = computed(() => {
  void app.flags
  void app.entitlements
  return starterOfferActive(tick.value)
})
const starterLeft = computed(() => {
  const end = starterOfferEndsAt()
  return end ? duration(end - tick.value) : ''
})

interface ShopRow {
  id: ProductId
  name: string
  desc: string
  icon: string
  owned: boolean
}
const shopRows = computed<ShopRow[]>(() => {
  const rows: ShopRow[] = []
  if (starterActive.value) {
    rows.push({ id: 'starter_pack', name: tr.market.starterPack, desc: tr.market.starterDesc, icon: 'icon_gift', owned: false })
  }
  rows.push({ id: 'remove_ads', name: tr.menu.removeAds, desc: tr.market.removeAdsDesc, icon: 'icon_ad', owned: app.noAds })
  rows.push({ id: 'bahsis_s', name: 'Küçük kese', desc: '500 bahşiş', icon: 'icon_coin', owned: false })
  rows.push({ id: 'bahsis_m', name: 'Orta kese', desc: '1.500 bahşiş', icon: 'icon_coin', owned: false })
  rows.push({ id: 'bahsis_l', name: 'Büyük kese', desc: '4.000 bahşiş', icon: 'icon_coin', owned: false })
  return rows
})

async function loadProducts() {
  productsFailed.value = false
  try {
    products.value = await services.purchases.getProducts()
  } catch {
    products.value = []
    productsFailed.value = true
  }
}

// ---------- Yaşam döngüsü ----------

watch(tab, (t) => {
  document.querySelector(`.tab[data-tab="${t}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  selected.value = null
  bus.emit('cosmetic:preview', null)
})

function back() {
  app.go('menu')
}

onMounted(() => {
  bus.emit('ambient:mode', 'preview')
  void loadProducts()
  timer = window.setInterval(() => (tick.value = clockNow().getTime()), 1000)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  bus.emit('cosmetic:preview', null)
  bus.emit('ambient:mode', 'menu')
})
</script>

<template>
  <div class="mkt">
    <TopBar :title="tr.market.title" @back="back" />
    <div class="mkt__spacer" />
    <section class="sheet">
      <nav class="tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          role="tab"
          class="tab"
          :class="{ on: tab === t.id, gift: t.id === 'shop' && starterActive }"
          :aria-selected="tab === t.id"
          :data-tab="t.id"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </nav>

      <div class="sheet__body">
        <!-- Kozmetik vitrini -->
        <div v-if="cards.length" class="grid" :class="`grid--${tab}`">
          <div v-for="c in cards" :key="c.id" class="card" :class="{ sel: selected?.id === c.id, eq: c.equipped }" @click="select(c)">
            <div class="card__thumb" :class="`thumb--${c.kind}`">
              <GlassThumb v-if="c.kind === 'glass'" :id="c.id" />
              <img v-else :src="thumb(c)" alt="" loading="lazy" />
              <span v-if="c.product && !c.owned" class="badge">{{ tr.market.premium }}</span>
              <img v-if="c.equipped" class="check" :src="ThemeService.url('icon_star')" alt="" />
            </div>
            <div class="card__name">{{ c.name }}</div>
            <GameButton
              size="small"
              :variant="cardAction(c).variant"
              :disabled="cardAction(c).disabled"
              :icon="cardAction(c).coin ? 'icon_coin' : undefined"
              @click="act(c)"
            >
              {{ cardAction(c).label }}
            </GameButton>
          </div>
        </div>

        <!-- Güçlendiriciler -->
        <div v-else-if="tab === 'boosters'" class="rows">
          <p class="free">{{ fmt(tr.market.freeLeft, { n: freeLeft }) }}</p>
          <div v-for="id in boosterIds" :key="id" class="row">
            <img class="row__icon" :src="ThemeService.url(boosterIcons[id])" alt="" />
            <div class="row__txt">
              <b>{{ tr.boosters[id] }}</b>
              <small>{{ tr.boosters[`${id}Desc`] }}</small>
              <small class="have">{{ fmt(tr.boosters.have, { n: inv.boosters[id] ?? 0 }) }}</small>
            </div>
            <div class="row__btns">
              <GameButton size="small" variant="primary" icon="icon_coin" :disabled="!econ.canAfford(BOOSTERS[id].price)" @click="buyB(id)">
                {{ num(BOOSTERS[id].price) }}
              </GameButton>
              <GameButton
                size="small"
                variant="accent"
                icon="icon_ad"
                :disabled="freeLeft <= 0 || adBusy || !app.rewardedAvailable"
                @click="freeB(id)"
              >
                Bedava
              </GameButton>
            </div>
          </div>
        </div>

        <!-- Kese -->
        <div v-else-if="tab === 'shop'" class="rows">
          <div v-for="r in shopRows" :key="r.id" class="row" :class="{ star: r.id === 'starter_pack' }">
            <img class="row__icon" :src="ThemeService.url(r.icon)" alt="" />
            <div class="row__txt">
              <b>{{ r.name }}</b>
              <small>{{ r.desc }}</small>
              <small v-if="r.id === 'starter_pack'" class="timer">{{ fmt(tr.market.starterEnds, { time: starterLeft }) }}</small>
            </div>
            <div class="row__btns">
              <GameButton v-if="r.owned" size="small" disabled>{{ tr.market.purchased }}</GameButton>
              <GameButton v-else size="small" variant="metal" :disabled="!priceOf(r.id) || app.purchaseBusy" @click="buyProduct(r.id)">
                {{ priceOf(r.id) ?? (products ? tr.common.priceUnavailable : tr.common.loading) }}
              </GameButton>
            </div>
          </div>
          <p v-if="productsFailed || (products && !products.length)" class="warn">
            Mağaza fiyatlarına ulaşılamadı. İnternet bağlantını kontrol et.
            <GameButton size="small" @click="loadProducts">Tekrar dene</GameButton>
          </p>
          <p class="fine">Fiyatlar mağazadan, yerel para biriminle gelir.</p>
          <GameButton size="small" variant="ghost" class="restore" :disabled="app.purchaseBusy" @click="restorePurchases">
            {{ tr.market.restore }}
          </GameButton>
        </div>
      </div>
    </section>
    <div v-if="app.purchaseBusy" class="busy">
      <span>{{ tr.common.loading }}</span>
    </div>
  </div>
</template>

<style scoped>
.mkt {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}
.mkt__spacer {
  flex: 1 1 30%;
  min-height: 120px;
}
.sheet {
  flex: 0 1 auto;
  height: min(62%, 640px);
  width: min(100%, 620px);
  align-self: center;
  display: flex;
  flex-direction: column;
  background: var(--c-paper);
  border: 4px solid var(--c-dark);
  border-bottom: 0;
  border-radius: 26px 26px 0 0;
  box-shadow: 0 -6px 0 rgba(59, 36, 22, 0.35);
  animation: sheet-in 360ms cubic-bezier(0.2, 1.2, 0.4, 1);
}
@keyframes sheet-in {
  from {
    transform: translateY(40%);
    opacity: 0;
  }
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 8px 8px 0;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.tabs::-webkit-scrollbar {
  display: none;
}
.tab {
  flex: 1 1 auto;
  border: 3px solid var(--c-dark);
  border-bottom: 0;
  border-radius: 14px 14px 0 0;
  background: var(--c-paper-2);
  color: var(--c-ink);
  font-weight: 900;
  font-size: 13px;
  padding: 10px 7px 8px;
  min-height: 44px;
  opacity: 0.75;
  position: relative;
}
.tab.on {
  background: var(--c-warm);
  color: var(--c-on-warm, #fff6e6);
  opacity: 1;
}
.tab.gift::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--c-bad);
  border: 2px solid #fff;
  animation: pulse 1.2s infinite;
}
@keyframes pulse {
  50% {
    transform: scale(1.35);
  }
}
.sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 3px solid var(--c-dark);
  padding: 12px 12px calc(16px + var(--safe-bottom));
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 10px;
}
.grid--venues {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}
.card {
  background: rgba(255, 255, 255, 0.55);
  border: 3px solid rgba(59, 36, 22, 0.3);
  border-radius: 16px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
  transition:
    transform 120ms,
    border-color 120ms;
}
.card.sel {
  border-color: var(--c-accent);
  transform: translateY(-2px);
  box-shadow: 0 0 0 3px rgba(30, 154, 168, 0.25);
}
.card.eq {
  background: #eef7e6;
}
.card__thumb {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  background: radial-gradient(circle at 50% 60%, #fff8ea, #e6d2a6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.thumb--glass {
  padding: 6px 14px 2px;
}
.thumb--pot img:not(.check) {
  width: 92%;
}
.thumb--venue {
  aspect-ratio: 4 / 3;
}
.thumb--venue img:not(.check) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 62%;
}
.badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: var(--c-metal);
  color: var(--c-on-metal, var(--c-ink));
  border: 2px solid var(--c-dark);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 900;
  padding: 1px 6px;
}
.check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
}
.card__name {
  font-weight: 900;
  font-size: 14px;
  text-align: center;
  line-height: 1.15;
  min-height: 2.3em;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card :deep(.btn) {
  width: 100%;
  font-size: 14px;
  padding: 6px 6px;
}
.card :deep(.btn img) {
  width: 20px;
  height: 20px;
}
.rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.55);
  border: 3px solid rgba(59, 36, 22, 0.3);
  border-radius: 16px;
  padding: 10px;
}
.row.star {
  border-color: var(--c-metal);
  background: linear-gradient(135deg, #fff6d8, #f6e2a8);
  animation: glow 2s ease-in-out infinite;
}
@keyframes glow {
  50% {
    box-shadow: 0 0 0 4px rgba(201, 162, 39, 0.35);
  }
}
.row__icon {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
}
.row__txt {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.row__txt small {
  font-weight: 600;
  font-size: 13px;
  opacity: 0.85;
}
.row__txt .have {
  font-weight: 900;
  opacity: 1;
}
.row__txt .timer {
  color: var(--c-warm);
  font-weight: 900;
  opacity: 1;
}
.row__btns {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.row__btns :deep(.btn) {
  min-width: 104px;
}
.row__btns :deep(.btn img) {
  width: 20px;
  height: 20px;
}
.free {
  margin: 0;
  text-align: center;
  font-weight: 800;
}
.warn {
  margin: 4px 0 0;
  text-align: center;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
.fine {
  margin: 0;
  font-size: 12px;
  text-align: center;
  opacity: 0.7;
}
.restore {
  align-self: center;
  color: var(--c-ink);
  border-color: rgba(59, 36, 22, 0.4);
}
.busy {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(24, 12, 4, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff6e6;
  font-weight: 900;
  font-size: 20px;
}
</style>
