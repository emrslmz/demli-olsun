<script setup lang="ts">
/** Ana Menü: arkada buharı tüten büyük bir bardak çay (Phaser ortam sahnesi). */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { startShift } from '@/app/flow'
import { msUntilNextIstanbulMidnight } from '@/core/daily'
import { duration, fmt, num, tr } from '@/i18n/tr'
import { services } from '@/services'
import { exitApp, pushBackHandler } from '@/services/platform/backButton'
import { ThemeService } from '@/services/theme/ThemeService'
import { useAppStore } from '@/stores/app'
import { useDailyStore } from '@/stores/daily'
import { useEconomyStore } from '@/stores/economy'
import { useInventoryStore } from '@/stores/inventory'
import { usePlayerStore } from '@/stores/player'
import { useProgressStore } from '@/stores/progress'
import CoinCounter from '@/ui/components/CoinCounter.vue'
import GameButton from '@/ui/components/GameButton.vue'

const emit = defineEmits<{ daily: []; devTap: [] }>()
const app = useAppStore()
const econ = useEconomyStore()
const progress = useProgressStore()
const daily = useDailyStore()
const player = usePlayerStore()
const inv = useInventoryStore()
const now = ref(Date.now())
let timer = 0
let offBack: (() => void) | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
    daily.refreshToday()
  }, 1000)
  offBack = pushBackHandler(() => app.confirm(tr.exitConfirm, () => void exitApp(), tr.common.yes, tr.common.no))
  if (!app.noAds) void services.ads.showBanner()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  offBack?.()
  void services.ads.hideBanner()
})

const dailyLabel = computed(() => {
  if (!daily.playedToday) return tr.menu.daily
  return fmt(tr.menu.dailyDone, { time: duration(msUntilNextIstanbulMidnight(new Date(now.value))) })
})

const hasBoosters = computed(() => Object.values(inv.boosters).some((n) => n > 0))

function start() {
  if (hasBoosters.value) app.open('boosters')
  else startShift([])
}

let taps = 0
let tapTimer = 0
function logoTap() {
  taps++
  clearTimeout(tapTimer)
  tapTimer = window.setTimeout(() => (taps = 0), 1200)
  if (taps >= 5) {
    taps = 0
    emit('devTap')
  }
}

</script>

<template>
  <div class="menu" :style="{ paddingBottom: `calc(14px + var(--safe-bottom) + ${app.bannerHeight}px)` }">
    <header class="menu__top">
      <div class="who">
        <span class="who__name">{{ player.nickname || 'Çırak' }}</span>
        <span class="who__title">{{ progress.title.name }} · {{ num(progress.totalServed) }} servis</span>
      </div>
      <div class="menu__top-right">
        <GameButton v-if="!app.noAds" size="small" variant="ghost" @click="app.go('market')">{{ tr.menu.removeAds }}</GameButton>
        <CoinCounter :value="econ.tips" />
      </div>
    </header>

    <div class="brand" @pointerdown="logoTap">
      <img class="brand__logo" :src="ThemeService.url('logo_emblem')" alt="" />
      <h1 class="brand__name">{{ tr.appName }}</h1>
      <p v-if="progress.bestScore > 0" class="brand__best">{{ tr.menu.best }}: {{ num(progress.bestScore) }}</p>
    </div>

    <nav class="menu__actions">
      <GameButton variant="primary" size="big" icon="icon_serve" @click="start">{{ tr.menu.startShift }}</GameButton>
      <GameButton variant="accent" icon="icon_clock" @click="emit('daily')">{{ dailyLabel }}</GameButton>
      <div class="menu__row">
        <GameButton variant="metal" icon="icon_shop" @click="app.go('market')">{{ tr.menu.market }}</GameButton>
        <GameButton variant="blue" icon="icon_trophy" @click="app.go('leaderboard')">{{ tr.menu.leaderboard }}</GameButton>
        <GameButton size="icon" icon="icon_settings" aria-label="Ayarlar" @click="app.go('settings')" />
      </div>
      <p v-if="progress.nextTitle" class="next">
        {{ fmt(tr.menu.nextTitle, { title: progress.nextTitle.name, n: progress.nextTitle.minServed - progress.totalServed }) }}
      </p>
    </nav>
  </div>
</template>

<style scoped>
.menu {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: calc(10px + var(--safe-top)) 16px 14px;
}
.menu__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.menu__top-right {
  display: flex;
  gap: 8px;
  align-items: center;
}
.who {
  display: flex;
  flex-direction: column;
  background: rgba(30, 43, 36, 0.86);
  border: 3px solid var(--c-dark);
  border-radius: 14px;
  padding: 6px 12px;
  color: #fff6e6;
  box-shadow: 0 3px 0 var(--c-dark);
}
.who__name {
  font-weight: 900;
  font-size: 17px;
}
.who__title {
  font-family: var(--f-chalk);
  font-size: 15px;
  opacity: 0.9;
}
.brand {
  margin-top: 2vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.brand__logo {
  width: min(30vw, 150px);
  filter: drop-shadow(0 6px 0 rgba(30, 14, 4, 0.45));
  animation: bob 3s ease-in-out infinite;
}
.brand__name {
  margin: 4px 0 0;
  font-size: clamp(40px, 12vw, 60px);
  font-weight: 1000;
  color: #fff6e6;
  -webkit-text-stroke: 2px var(--c-dark);
  text-shadow: 0 5px 0 var(--c-dark);
  line-height: 1;
}
.brand__best {
  margin: 8px 0 0;
  font-family: var(--f-chalk);
  font-weight: 700;
  font-size: 20px;
  color: #fff6e6;
  text-shadow: 0 2px 0 var(--c-dark);
}
.menu__actions {
  margin-top: auto;
  width: min(100%, 440px);
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.menu__row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
}
.next {
  margin: 0;
  text-align: center;
  font-family: var(--f-chalk);
  font-weight: 700;
  color: #fff6e6;
  text-shadow: 0 2px 0 var(--c-dark);
}
@keyframes bob {
  50% {
    transform: translateY(-6px) rotate(-2deg);
  }
}
</style>
