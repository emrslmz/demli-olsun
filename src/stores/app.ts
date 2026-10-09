/** Uygulama düzeyi durum: bayraklar, reklam sayaçları, satın alma önbelleği, ekran yönetimi. */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { MarketTab } from '@/app/market'
import type { EntitlementId } from '@/config/products'
import { defaultSave, type SaveData } from '@/services/save/schema'

export type Screen = 'splash' | 'onboarding' | 'menu' | 'market' | 'leaderboard' | 'settings' | 'game' | 'gameover' | 'dailyResult'

export type ModalName =
  'pause' | 'continue' | 'dailyReward' | 'starterOffer' | 'leagueResult' | 'confirm' | 'consentIntro' | 'dev' | 'boosters'

export const useAppStore = defineStore('app', () => {
  const screen = ref<Screen>('splash')
  /** Çarşı açılırken seçili sekme. */
  const marketTab = ref<MarketTab>('glasses')
  const modal = ref<ModalName | null>(null)
  const flags = ref<SaveData['flags']>({ ...defaultSave().flags })
  const ads = ref<SaveData['ads']>({ ...defaultSave().ads })
  const processedTransactions = ref<string[]>([])
  const entitlements = ref<EntitlementId[]>([])
  /** Bu oturumda satın alma yapıldı mı (geçiş reklamı kuralı). */
  const purchasedThisSession = ref(false)
  /** Satın alma sürüyor: arayüz kilitli. */
  const purchaseBusy = ref(false)
  /** Banner yüksekliği (CSS px), menü içeriği bunun üstünde kalsın. */
  const bannerHeight = ref(0)
  const rewardedAvailable = ref(false)
  const phaserReady = ref(false)
  /** Kısa bilgi mesajı (toast). */
  const toast = ref<{ text: string; id: number } | null>(null)
  /** Onay penceresi içeriği. */
  const confirmState = ref<{ text: string; yes: string; no: string; onYes: () => void } | null>(null)

  const noAds = computed(() => entitlements.value.includes('no_ads'))

  function go(s: Screen) {
    screen.value = s
  }

  function openMarket(tab: MarketTab = 'glasses') {
    marketTab.value = tab
    screen.value = 'market'
  }

  function open(m: ModalName | null) {
    modal.value = m
  }

  let toastId = 0
  function showToast(text: string) {
    toast.value = { text, id: ++toastId }
    const id = toastId
    setTimeout(() => {
      if (toast.value?.id === id) toast.value = null
    }, 2600)
  }

  function confirm(text: string, onYes: () => void, yes = 'Evet', no = 'Vazgeç') {
    confirmState.value = { text, yes, no, onYes }
    modal.value = 'confirm'
  }

  function hasEntitlement(e: EntitlementId): boolean {
    return entitlements.value.includes(e)
  }

  return {
    screen,
    marketTab,
    modal,
    flags,
    ads,
    processedTransactions,
    entitlements,
    purchasedThisSession,
    purchaseBusy,
    bannerHeight,
    rewardedAvailable,
    phaserReady,
    toast,
    confirmState,
    noAds,
    confirm,
    go,
    openMarket,
    open,
    showToast,
    hasEntitlement,
  }
})
