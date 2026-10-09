<script setup lang="ts">
/** Başlangıç Paketi: 3. mesaiden sonra bir kez gösterilir, 48 saat Kese'de geri sayımla kalır. */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { now as clockNow } from '@/app/clock'
import { buyProduct } from '@/app/flow'
import { starterOfferEndsAt } from '@/app/market'
import { STARTER_OFFER } from '@/config/economy'
import { duration, fmt, num, tr } from '@/i18n/tr'
import { services } from '@/services'
import { ThemeService } from '@/services/theme/ThemeService'
import { useAppStore } from '@/stores/app'
import GameButton from '@/ui/components/GameButton.vue'
import GlassThumb from '@/ui/components/GlassThumb.vue'
import Modal from '@/ui/components/Modal.vue'

const app = useAppStore()
const price = ref<string | null>(null)
const loaded = ref(false)
const tick = ref(clockNow().getTime())
let timer = 0

const left = computed(() => {
  const end = starterOfferEndsAt()
  return end ? duration(end - tick.value) : ''
})

onMounted(async () => {
  timer = window.setInterval(() => (tick.value = clockNow().getTime()), 1000)
  try {
    const list = await services.purchases.getProducts()
    price.value = list.find((p) => p.id === 'starter_pack')?.priceString ?? null
  } catch {
    price.value = null
  }
  loaded.value = true
})
onBeforeUnmount(() => clearInterval(timer))

async function buy() {
  if (await buyProduct('starter_pack')) app.open(null)
}
</script>

<template>
  <Modal :title="tr.starter.title" @close="app.open(null)">
    <p class="lead">{{ tr.starter.body }}</p>
    <div class="items">
      <div class="it">
        <img :src="ThemeService.url('icon_coin')" alt="" />
        <b>{{ num(STARTER_OFFER.tips) }}</b>
        <small>bahşiş</small>
      </div>
      <div class="it">
        <div class="glass"><GlassThumb :id="STARTER_OFFER.glassId" /></div>
        <b>Başlangıç</b>
        <small>bardağı</small>
      </div>
      <div class="it">
        <img :src="ThemeService.url('icon_gift')" alt="" />
        <b>3 × 3</b>
        <small>güçlendirici</small>
      </div>
    </div>
    <p v-if="left" class="timer">{{ fmt(tr.market.starterEnds, { time: left }) }}</p>
    <div class="col">
      <GameButton variant="metal" size="big" :disabled="!price || app.purchaseBusy" @click="buy">
        {{ price ?? (loaded ? tr.common.priceUnavailable : tr.common.loading) }}
      </GameButton>
      <GameButton variant="ghost" class="later" @click="app.open(null)">{{ tr.starter.later }}</GameButton>
    </div>
  </Modal>
</template>

<style scoped>
.lead {
  margin: 0 0 12px;
  text-align: center;
  font-weight: 800;
}
.items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.it {
  background: linear-gradient(135deg, #fff6d8, #f6e2a8);
  border: 3px solid var(--c-metal);
  border-radius: 14px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: 900;
  animation: pop 420ms cubic-bezier(0.2, 1.5, 0.4, 1) backwards;
}
.it:nth-child(2) {
  animation-delay: 90ms;
}
.it:nth-child(3) {
  animation-delay: 180ms;
}
@keyframes pop {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
}
.it img,
.glass {
  width: 52px;
  height: 52px;
}
.it small {
  font-weight: 700;
  opacity: 0.8;
}
.timer {
  text-align: center;
  color: var(--c-warm);
  font-weight: 900;
  margin: 12px 0 4px;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.later {
  color: var(--c-ink);
  border-color: rgba(59, 36, 22, 0.35);
}
</style>
