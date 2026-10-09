<script setup lang="ts">
/** Ekran yöneticisi (basit state, router yok). Phaser kanvası sürekli monte; Vue menüleri üstüne biner. */
import { onMounted, ref } from 'vue'
import { bus } from '@/bus'
import PhaserHost from '@/game/PhaserHost.vue'
import { bootstrap, hideNativeSplash } from '@/app/bootstrap'
import { useAppStore } from '@/stores/app'
import Splash from '@/ui/screens/Splash.vue'

const app = useAppStore()
const ready = ref(false)

onMounted(async () => {
  const started = performance.now()
  bus.on('game:booted', async () => {
    app.phaserReady = true
    await hideNativeSplash()
    const wait = Math.max(0, 700 - (performance.now() - started))
    setTimeout(() => app.go('menu'), wait)
  })
  await bootstrap()
  ready.value = true
  // Splash en fazla 3 sn kalır.
  setTimeout(() => {
    if (app.screen === 'splash') {
      void hideNativeSplash()
      app.go('menu')
    }
  }, 3000)
})

function start(mode: 'shift' | 'daily' | 'tutorial') {
  app.go('game')
  if (mode === 'shift') bus.emit('game:start', { mode: 'shift', boosters: [] })
  else if (mode === 'tutorial') bus.emit('game:start', { mode: 'tutorial' })
}

function quit() {
  bus.emit('game:quit')
  app.go('menu')
}
</script>

<template>
  <PhaserHost v-if="ready" />
  <Transition name="screen">
    <Splash v-if="app.screen === 'splash'" />
  </Transition>
  <div v-if="app.screen === 'menu'" class="tmp-menu">
    <button class="btn btn--primary btn--big" @click="start('shift')">Mesaiye başla</button>
    <button class="btn" @click="start('tutorial')">Eğitim</button>
  </div>
  <button v-if="app.screen === 'game'" class="btn btn--small tmp-quit" @click="quit">Menü</button>
</template>

<style scoped>
.tmp-menu {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(40px + var(--safe-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.tmp-quit {
  position: absolute;
  top: calc(10px + var(--safe-top));
  right: 10px;
}
</style>
