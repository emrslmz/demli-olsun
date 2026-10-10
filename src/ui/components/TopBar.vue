<script setup lang="ts">
/** Alt ekranların üst çubuğu: geri, başlık, bahşiş. */
import { onBeforeUnmount, onMounted } from 'vue'
import { pushBackHandler } from '@/services/platform/backButton'
import { tr } from '@/i18n/tr'
import { useEconomyStore } from '@/stores/economy'
import CoinCounter from './CoinCounter.vue'
import GameButton from './GameButton.vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ back: [] }>()
const econ = useEconomyStore()
let off: (() => void) | null = null
onMounted(() => (off = pushBackHandler(() => emit('back'))))
onBeforeUnmount(() => off?.())
</script>

<template>
  <header class="topbar">
    <GameButton size="icon" icon="icon_back" :aria-label="tr.common.back" @click="emit('back')" />
    <h1 class="topbar__title">{{ title }}</h1>
    <CoinCounter :value="econ.tips" />
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(10px + var(--safe-top)) 14px 10px;
}
.topbar__title {
  flex: 1;
  margin: 0;
  font-family: var(--f-chalk);
  font-weight: 700;
  font-size: 34px;
  color: #fff6e6;
  text-shadow: 0 3px 0 var(--c-dark);
  -webkit-text-stroke: 1px var(--c-dark);
}
</style>
