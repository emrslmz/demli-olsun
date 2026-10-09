<script setup lang="ts">
/** Ekran yöneticisi (basit state, router yok). Phaser kanvası sürekli monte; Vue menüleri üstüne biner. */
import { defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { bus } from '@/bus'
import PhaserHost from '@/game/PhaserHost.vue'
import { bootstrap, hideNativeSplash } from '@/app/bootstrap'
import {
  initPurchases,
  onContinueOffer,
  onDailyFinished,
  onGameOver,
  onTutorialFinished,
  pauseGame,
  refreshPurchases,
  startDaily,
  startTutorial,
} from '@/app/flow'
import { resolveLeagueWeek } from '@/app/league'
import { maybeStartStarterOffer } from '@/app/market'
import { services } from '@/services'
import { AudioService } from '@/services/audio/AudioService'
import { useAppStore } from '@/stores/app'
import { useDailyStore } from '@/stores/daily'
import { saveNow } from '@/stores/persist'
import { usePlayerStore } from '@/stores/player'
import { useSessionStore } from '@/stores/session'
import Toast from '@/ui/components/Toast.vue'
import Splash from '@/ui/screens/Splash.vue'
import MainMenu from '@/ui/screens/MainMenu.vue'
import GameOver from '@/ui/screens/GameOver.vue'
import PauseModal from '@/ui/modals/PauseModal.vue'
import ContinueModal from '@/ui/modals/ContinueModal.vue'
import BoostersModal from '@/ui/modals/BoostersModal.vue'
import ConfirmDialog from '@/ui/modals/ConfirmDialog.vue'

const Onboarding = defineAsyncComponent(() => import('@/ui/screens/Onboarding.vue'))
const Settings = defineAsyncComponent(() => import('@/ui/screens/Settings.vue'))
const Market = defineAsyncComponent(() => import('@/ui/screens/Market.vue'))
const DailyResult = defineAsyncComponent(() => import('@/ui/screens/DailyResult.vue'))
const Leaderboard = defineAsyncComponent(() => import('@/ui/screens/Leaderboard.vue'))
const DailyRewardModal = defineAsyncComponent(() => import('@/ui/modals/DailyRewardModal.vue'))
const ConsentIntroModal = defineAsyncComponent(() => import('@/ui/modals/ConsentIntroModal.vue'))
const StarterOfferModal = defineAsyncComponent(() => import('@/ui/modals/StarterOfferModal.vue'))
const DevMenu = defineAsyncComponent(() => import('@/ui/modals/DevMenu.vue'))
const LeagueResultModal = defineAsyncComponent(() => import('@/ui/modals/LeagueResultModal.vue'))

const DEV_MENU = import.meta.env.DEV || import.meta.env.MODE === 'debug' || import.meta.env.VITE_DEV_MENU === 'true'

const app = useAppStore()
const daily = useDailyStore()
const player = usePlayerStore()
const session = useSessionStore()
const ready = ref(false)

/** Açılıştan sonra ilk ekran: takma ad → eğitim → menü. */
function routeAfterSplash() {
  if (app.screen !== 'splash') return
  void hideNativeSplash()
  if (!app.flags.onboardingDone) app.go('onboarding')
  else if (!app.flags.tutorialDone) startTutorial()
  else app.go('menu')
}

async function onOnboarded(name: string) {
  player.setNickname(name)
  app.flags = { ...app.flags, onboardingDone: true }
  await saveNow()
  if (!app.flags.tutorialDone) startTutorial()
  else app.go('menu')
}

/** Menüye dönüşte sırayla bekleyen pencereler: onay bilgisi → giriş ödülü → başlangıç teklifi. */
let menuTimer = 0
function checkMenuQueue() {
  clearTimeout(menuTimer)
  if (app.screen !== 'menu' || app.modal) return
  menuTimer = window.setTimeout(async () => {
    if (app.flags.tutorialDone) await resolveLeagueWeek()
    if (app.screen !== 'menu' || app.modal) return
    if (app.flags.tutorialDone && !app.flags.consentDone) app.open('consentIntro')
    else if (session.leagueResult) app.open('leagueResult')
    else if (daily.pendingLogin) app.open('dailyReward')
    else if (maybeStartStarterOffer()) app.open('starterOffer')
  }, 650)
}
watch(() => [app.screen, app.modal] as const, checkMenuQueue)

function wireBus() {
  bus.on('game:pause-request', () => pauseGame())
  bus.on('game:continue-offer', (offer) => onContinueOffer(offer))
  bus.on('game:over', (r) => void onGameOver(r))
  bus.on('tutorial:finished', () => void onTutorialFinished())
  bus.on('daily:finished', (r) => void onDailyFinished(r))
  bus.on('app:background', () => {
    if (app.screen === 'game' && !app.modal) pauseGame()
  })
  bus.on('app:foreground', () => {
    daily.refreshToday()
    void refreshPurchases()
    checkMenuQueue()
  })
  services.ads.on((e) => {
    if (e.type === 'fullscreen') {
      AudioService.setInterrupted(e.open)
      bus.emit('app:interrupt', e.open)
    } else if (e.type === 'banner') {
      app.bannerHeight = e.height
    } else if (e.type === 'availability') {
      app.rewardedAvailable = e.rewarded
    }
  })
}

function devTap() {
  if (DEV_MENU) app.open('dev')
}

onMounted(async () => {
  const started = performance.now()
  bus.on('game:booted', async () => {
    app.phaserReady = true
    const wait = Math.max(0, 700 - (performance.now() - started))
    setTimeout(routeAfterSplash, wait)
  })
  await bootstrap()
  wireBus()
  await services.ads.init()
  // Onayı daha önce verilmiş oyuncuda UMP bilgisi her açılışta tazelenir, ardından AdMob başlar.
  if (app.flags.consentDone) void services.ads.runConsentFlow()
  void initPurchases()
  ready.value = true
  // Splash en fazla 3 sn kalır.
  setTimeout(routeAfterSplash, 3000)
})
</script>

<template>
  <PhaserHost v-if="ready" />
  <Transition name="screen" mode="out-in">
    <Splash v-if="app.screen === 'splash'" key="splash" />
    <Onboarding v-else-if="app.screen === 'onboarding'" key="onboarding" @done="onOnboarded" />
    <MainMenu v-else-if="app.screen === 'menu'" key="menu" @daily="startDaily" @dev-tap="devTap" />
    <GameOver v-else-if="app.screen === 'gameover'" key="gameover" />
    <Settings v-else-if="app.screen === 'settings'" key="settings" />
    <Market v-else-if="app.screen === 'market'" key="market" :initial-tab="app.marketTab" />
    <DailyResult v-else-if="app.screen === 'dailyResult'" key="dailyResult" />
    <Leaderboard v-else-if="app.screen === 'leaderboard'" key="leaderboard" />
  </Transition>
  <Transition name="modal">
    <PauseModal v-if="app.modal === 'pause'" />
    <ContinueModal v-else-if="app.modal === 'continue'" />
    <BoostersModal v-else-if="app.modal === 'boosters'" />
    <ConfirmDialog v-else-if="app.modal === 'confirm'" />
    <DailyRewardModal v-else-if="app.modal === 'dailyReward'" />
    <ConsentIntroModal v-else-if="app.modal === 'consentIntro'" />
    <StarterOfferModal v-else-if="app.modal === 'starterOffer'" />
    <LeagueResultModal v-else-if="app.modal === 'leagueResult'" />
    <DevMenu v-else-if="app.modal === 'dev'" />
  </Transition>
  <Toast />
</template>
