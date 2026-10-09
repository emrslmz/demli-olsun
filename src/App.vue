<script setup lang="ts">
/** Ekran yöneticisi (basit state, router yok). Phaser kanvası sürekli monte; Vue menüleri üstüne biner. */
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { bus } from '@/bus'
import PhaserHost from '@/game/PhaserHost.vue'
import { bootstrap, hideNativeSplash } from '@/app/bootstrap'
import { onContinueOffer, onGameOver, pauseGame } from '@/app/flow'
import { services } from '@/services'
import { AudioService } from '@/services/audio/AudioService'
import { useAppStore } from '@/stores/app'
import Toast from '@/ui/components/Toast.vue'
import Splash from '@/ui/screens/Splash.vue'
import MainMenu from '@/ui/screens/MainMenu.vue'
import GameOver from '@/ui/screens/GameOver.vue'
import PauseModal from '@/ui/modals/PauseModal.vue'
import ContinueModal from '@/ui/modals/ContinueModal.vue'
import BoostersModal from '@/ui/modals/BoostersModal.vue'
import ConfirmDialog from '@/ui/modals/ConfirmDialog.vue'

const ComingSoon = defineAsyncComponent(() => import('@/ui/screens/ComingSoon.vue'))

const app = useAppStore()
const ready = ref(false)

function wireBus() {
  bus.on('game:pause-request', () => pauseGame())
  bus.on('game:continue-offer', (offer) => onContinueOffer(offer))
  bus.on('game:over', (r) => void onGameOver(r))
  bus.on('app:background', () => {
    if (app.screen === 'game' && !app.modal) pauseGame()
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

onMounted(async () => {
  const started = performance.now()
  bus.on('game:booted', async () => {
    app.phaserReady = true
    await hideNativeSplash()
    const wait = Math.max(0, 700 - (performance.now() - started))
    setTimeout(() => {
      if (app.screen === 'splash') app.go('menu')
    }, wait)
  })
  await bootstrap()
  wireBus()
  await services.ads.init()
  ready.value = true
  // Splash en fazla 3 sn kalır.
  setTimeout(() => {
    if (app.screen === 'splash') {
      void hideNativeSplash()
      app.go('menu')
    }
  }, 3000)
})
</script>

<template>
  <PhaserHost v-if="ready" />
  <Transition name="screen" mode="out-in">
    <Splash v-if="app.screen === 'splash'" key="splash" />
    <MainMenu v-else-if="app.screen === 'menu'" key="menu" @daily="app.showToast('Günün siparişi yakında.')" />
    <GameOver v-else-if="app.screen === 'gameover'" key="gameover" />
    <ComingSoon v-else-if="app.screen !== 'game'" :key="app.screen" />
  </Transition>
  <Transition name="modal">
    <PauseModal v-if="app.modal === 'pause'" />
    <ContinueModal v-else-if="app.modal === 'continue'" />
    <BoostersModal v-else-if="app.modal === 'boosters'" />
    <ConfirmDialog v-else-if="app.modal === 'confirm'" />
  </Transition>
  <Toast />
</template>
