<script setup lang="ts">
/** Ana Menü: arkada buharı tüten büyük bir bardak çay (Phaser ortam sahnesi). */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { now as clockNow } from '@/app/clock'
import { bus } from '@/bus'
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
const now = ref(clockNow().getTime())
let timer = 0
let offBack: (() => void) | null = null
/** Logo ile butonlar arasındaki boşluk: ortam sahnesindeki bardak buraya sığdırılır. */
const heroEl = ref<HTMLElement | null>(null)
let heroObs: ResizeObserver | null = null
function reportHeroSlot() {
  // offsetTop: ekran giriş animasyonundaki transform'dan etkilenmez (menü tam ekran, üstü 0).
  const el = heroEl.value
  if (el) bus.emit('menu:hero-slot', { top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight })
}

onMounted(() => {
  heroObs = new ResizeObserver(reportHeroSlot)
  if (heroEl.value) heroObs.observe(heroEl.value)
  bus.on('menu:hero-request', reportHeroSlot)
  timer = window.setInterval(() => {
    now.value = clockNow().getTime()
    daily.refreshToday()
  }, 1000)
  offBack = pushBackHandler(() => app.confirm(tr.exitConfirm, () => void exitApp(), tr.common.yes, tr.common.no))
  if (!app.noAds) void services.ads.showBanner()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  offBack?.()
  heroObs?.disconnect()
  bus.off('menu:hero-request', reportHeroSlot)
  void services.ads.hideBanner()
})

const dailyLabel = computed(() => {
  if (!daily.playedToday) return tr.menu.daily
  return fmt(tr.menu.dailyDone, { time: duration(msUntilNextIstanbulMidnight(new Date(now.value))) })
})

const titlePct = computed(() => {
  const next = progress.nextTitle
  if (!next) return 100
  const from = progress.title.minServed
  return Math.round(((progress.totalServed - from) / Math.max(1, next.minServed - from)) * 100)
})
const nextTitleText = computed(() =>
  progress.nextTitle
    ? fmt(tr.menu.nextTitle, { title: progress.nextTitle.name, n: progress.nextTitle.minServed - progress.totalServed })
    : '',
)

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
        <img class="who__icon" :src="ThemeService.url('icon_life')" alt="" />
        <div class="who__txt">
          <span class="who__name">{{ player.nickname || 'Çırak' }}</span>
          <span class="who__title">{{ progress.title.name }}</span>
          <div v-if="progress.nextTitle" class="who__bar" :title="nextTitleText">
            <i :style="{ width: `${titlePct}%` }" />
          </div>
        </div>
      </div>
      <div class="menu__top-right">
        <CoinCounter :value="econ.tips" />
        <GameButton v-if="!app.noAds" size="small" variant="metal" @click="app.openMarket('shop')">{{ tr.menu.removeAds }}</GameButton>
      </div>
    </header>

    <div class="brand" @pointerdown="logoTap">
      <h1 class="brand__name"><span>Demli</span><span>Olsun</span></h1>
      <p v-if="progress.bestScore > 0" class="brand__best">
        <img :src="ThemeService.url('icon_trophy')" alt="" />{{ num(progress.bestScore) }}
      </p>
    </div>

    <div ref="heroEl" class="hero-slot" aria-hidden="true" />
    <nav class="menu__actions">
      <GameButton class="play" variant="go" size="big" icon="icon_serve" @click="start">{{ tr.menu.startShift }}</GameButton>
      <GameButton class="daily" variant="accent" icon="icon_clock" @click="emit('daily')">{{ dailyLabel }}</GameButton>
      <div class="menu__row">
        <div class="tile">
          <GameButton size="icon" variant="metal" icon="icon_shop" :aria-label="tr.menu.market" @click="app.openMarket()" />
          <span>{{ tr.menu.market }}</span>
        </div>
        <div class="tile">
          <GameButton size="icon" variant="blue" icon="icon_trophy" :aria-label="tr.menu.leaderboard" @click="app.go('leaderboard')" />
          <span>{{ tr.menu.leaderboard }}</span>
        </div>
        <div class="tile">
          <GameButton size="icon" icon="icon_settings" :aria-label="tr.menu.settings" @click="app.go('settings')" />
          <span>{{ tr.menu.settings }}</span>
        </div>
      </div>
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
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}
.who {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(180deg, #fffaf0, #f3e2c2);
  border: 3px solid var(--c-dark);
  border-radius: 18px;
  padding: 4px 12px 4px 6px;
  color: var(--c-ink);
  box-shadow: 0 4px 0 var(--c-dark);
}
.who__icon {
  width: 40px;
  height: 40px;
}
.who__txt {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}
.who__name {
  font-weight: 800;
  font-size: 17px;
}
.who__title {
  font-weight: 600;
  font-size: 13px;
  color: #8a5a33;
}
.who__bar {
  margin-top: 3px;
  height: 7px;
  width: 110px;
  border-radius: 99px;
  background: #e5d3b0;
  border: 1.5px solid rgba(59, 36, 22, 0.5);
  overflow: hidden;
}
.who__bar i {
  display: block;
  height: 100%;
  background: linear-gradient(180deg, #8fdc6a, #4cb848);
  border-radius: 99px;
}
.brand {
  margin-top: 1.5vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.brand__name {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: clamp(54px, 17vw, 84px);
  font-weight: 800;
  line-height: 0.82;
  color: #fff3d6;
  -webkit-text-stroke: 8px var(--c-dark);
  paint-order: stroke fill;
  text-shadow: 0 7px 0 var(--c-dark);
  transform: rotate(-4deg);
  animation: brand-in 600ms cubic-bezier(0.2, 1.4, 0.4, 1) both;
}
.brand__name span:last-child {
  color: #ffc24a;
  margin-left: 0.6em;
}
.brand__best {
  margin: 12px 0 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  font-size: 18px;
  color: var(--c-ink);
  background: rgba(255, 246, 230, 0.92);
  border: 3px solid var(--c-dark);
  border-radius: 99px;
  padding: 2px 14px 2px 6px;
  box-shadow: 0 3px 0 var(--c-dark);
}
.brand__best img {
  width: 26px;
  height: 26px;
}
.hero-slot {
  flex: 1 1 auto;
  min-height: 0;
}
.menu__actions {
  width: min(100%, 420px);
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.play {
  font-size: 28px;
  min-height: 78px;
  animation: pulse 2.4s ease-in-out infinite;
}
.daily {
  font-size: 18px;
}
.menu__row {
  display: flex;
  justify-content: space-around;
  margin-top: 2px;
}
.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #fff6e6;
  font-weight: 800;
  font-size: 15px;
  text-shadow:
    0 2px 0 var(--c-dark),
    0 0 3px var(--c-dark);
}
/* Kısa ekranlarda logo ve butonlar küçülür, bardağa yer kalır. */
@media (max-height: 700px) {
  .brand {
    margin-top: 0;
  }
  .brand__name {
    font-size: clamp(44px, 13vw, 62px);
    -webkit-text-stroke-width: 6px;
    text-shadow: 0 5px 0 var(--c-dark);
  }
  .brand__best {
    margin-top: 6px;
    font-size: 15px;
  }
  .menu__actions {
    gap: 8px;
  }
  .play {
    font-size: 24px;
    min-height: 62px;
  }
}
@keyframes brand-in {
  from {
    transform: rotate(-4deg) scale(0.6);
    opacity: 0;
  }
}
@keyframes pulse {
  50% {
    transform: scale(1.03);
  }
}
</style>
