<script setup lang="ts">
/**
 * Phaser kanvasını monte eder ve sürekli monte tutar. Menülerdeyken arkada ortam sahnesi döner.
 * Phaser dinamik import ile ayrı chunk'a alınır ki menü hızlı açılsın.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { GameHandle } from './createGame'
import { getSafeArea, onSafeAreaChange } from '@/services/platform/safeArea'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'

const host = ref<HTMLDivElement | null>(null)
const app = useAppStore()
const settings = useSettingsStore()
let handle: GameHandle | null = null
let ro: ResizeObserver | null = null
let offSafe: (() => void) | null = null

function measure() {
  const el = host.value
  if (!el || !handle) return
  handle.resize(el.clientWidth, el.clientHeight, getSafeArea())
}

onMounted(async () => {
  const el = host.value
  if (!el) return
  const { createGame } = await import('./createGame')
  handle = createGame(el, el.clientWidth || window.innerWidth, el.clientHeight || window.innerHeight, getSafeArea())
  if (settings.data.lowQuality) handle.setLowQuality(true)
  ro = new ResizeObserver(() => measure())
  ro.observe(el)
  offSafe = onSafeAreaChange(() => measure())
  ;(window as unknown as { __demli?: GameHandle }).__demli = handle
})

// Menülerde ortam sahnesi 30 FPS'te çalışır; oyunda tam hız.
watch(
  () => app.screen,
  (s) => handle?.setFpsLimit(s === 'game' ? 0 : 30),
)

watch(
  () => settings.data.lowQuality,
  (v) => handle?.setLowQuality(v),
)

onBeforeUnmount(() => {
  ro?.disconnect()
  offSafe?.()
  handle?.destroy()
  handle = null
})
</script>

<template>
  <div ref="host" class="phaser-host" />
</template>

<style scoped>
.phaser-host {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
}
</style>
