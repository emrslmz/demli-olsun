<script setup lang="ts">
/** Günün Siparişi sonucu: isabet (1 ondalık), metrik kareleri, seri, yüzdelik dilim, paylaş. */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { now as clockNow } from '@/app/clock'
import { maybeAskNotifications, quitToMenu, shareDaily } from '@/app/flow'
import { useAppStore } from '@/stores/app'
import { metricSquares, msUntilNextIstanbulMidnight } from '@/core/daily'
import { customerImageId, customerName } from '@/data/customers'
import { duration, fmt, num, pct, pctInt, possessiveAblative, tr } from '@/i18n/tr'
import { ThemeService } from '@/services/theme/ThemeService'
import { useDailyStore } from '@/stores/daily'
import { useEconomyStore } from '@/stores/economy'
import { useSessionStore } from '@/stores/session'
import CoinCounter from '@/ui/components/CoinCounter.vue'
import GameButton from '@/ui/components/GameButton.vue'
import Panel from '@/ui/components/Panel.vue'
import { pushBackHandler } from '@/services/platform/backButton'

const session = useSessionStore()
const daily = useDailyStore()
const econ = useEconomyStore()
const r = computed(() => session.dailyResult)
const shown = ref(0)
const tick = ref(clockNow().getTime())
const sharing = ref(false)
let timer = 0
let offBack: (() => void) | null = null

const expr = computed(() => {
  const x = r.value
  if (!x || !x.accepted) return 'angry' as const
  return (x.customer === 'riza' ? x.stars === 3 : x.stars >= 2) ? ('happy' as const) : ('neutral' as const)
})
const nextIn = computed(() => duration(msUntilNextIstanbulMidnight(new Date(tick.value))))
const pctText = computed(() => {
  const p = session.dailyPercentile
  if (p === null) return ''
  const n = Math.round(p)
  return n < 1 ? tr.daily.keepGoing : fmt(tr.daily.betterThan, { n, sfx: possessiveAblative(n) })
})
const sugarRow = computed(() => (r.value && r.value.sugarTarget > 0 ? r.value : null))

onMounted(() => {
  const target = r.value?.accuracy ?? 0
  const t0 = performance.now()
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / 1200)
    shown.value = Math.round(target * (1 - Math.pow(1 - k, 3)) * 10) / 10
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
  timer = window.setInterval(() => (tick.value = clockNow().getTime()), 1000)
  offBack = pushBackHandler(toMenu)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  offBack?.()
})

/** Menüye dönüşte (ilk günlükten sonra bir kez) bildirim teklifi. */
function toMenu() {
  quitToMenu()
  const app = useAppStore()
  window.setTimeout(() => {
    if (app.screen === 'menu' && !app.modal) maybeAskNotifications()
  }, 700)
}

async function share() {
  if (!r.value || sharing.value) return
  sharing.value = true
  try {
    await shareDaily(r.value)
  } finally {
    sharing.value = false
  }
}
</script>

<template>
  <div v-if="r" class="dr">
    <div class="dr__top"><CoinCounter :value="econ.tips" /></div>
    <Panel>
      <div class="dr__body">
        <h1 class="dr__title">{{ fmt(tr.daily.title, { n: r.dayNumber }) }}</h1>
        <div class="who">
          <img :src="ThemeService.url(customerImageId(r.customer, expr))" alt="" />
          <div class="quote">
            <small>{{ customerName(r.customer) }}</small>
            <span>“{{ r.line }}”</span>
          </div>
        </div>
        <div class="acc">
          <span>{{ tr.daily.accuracy }}</span>
          <b>{{ pct(shown) }}</b>
          <div class="stars">
            <img
              v-for="i in 3"
              :key="i"
              :src="ThemeService.url(i <= r.stars ? 'icon_star' : 'icon_star_empty')"
              alt=""
              :style="{ animationDelay: `${0.9 + i * 0.15}s` }"
            />
          </div>
        </div>
        <div class="metrics">
          <div>
            <span>{{ tr.daily.color }}</span>
            <i>{{ metricSquares(r.demScore) }}</i>
            <small>{{ pct(r.demPct) }} / {{ pctInt(r.targetDem) }}</small>
          </div>
          <div>
            <span>{{ tr.daily.fill }}</span>
            <i>{{ metricSquares(r.fillScore) }}</i>
            <small>{{ pct(r.fillPct) }} / {{ pctInt(r.targetFill) }}</small>
          </div>
          <div v-if="sugarRow">
            <span>{{ tr.daily.sugar }}</span>
            <i>{{ sugarRow.sugarGiven === sugarRow.sugarTarget ? '🟩' : '🟥' }}</i>
            <small>{{ sugarRow.sugarGiven }} / {{ sugarRow.sugarTarget }}</small>
          </div>
        </div>
        <div class="chips">
          <span class="chip fire">🔥 {{ tr.daily.streak }} {{ daily.streak }}</span>
          <span class="chip coin"><img :src="ThemeService.url('icon_coin')" alt="" />+{{ num(r.tips) }}</span>
        </div>
        <p class="pct">
          <template v-if="pctText">{{ pctText }}</template>
          <template v-else>&nbsp;</template>
        </p>
        <p class="next">{{ fmt(tr.daily.nextIn, { time: nextIn }) }}</p>
      </div>
    </Panel>
    <div class="dr__buttons">
      <GameButton variant="blue" size="big" icon="icon_share" :disabled="sharing" @click="share">{{ tr.daily.share }}</GameButton>
      <GameButton @click="toMenu">{{ tr.daily.menu }}</GameButton>
    </div>
  </div>
</template>

<style scoped>
.dr {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: calc(16px + var(--safe-top)) 16px calc(16px + var(--safe-bottom));
  background: rgba(24, 12, 4, 0.6);
  overflow-y: auto;
}
.dr__top {
  position: absolute;
  top: calc(12px + var(--safe-top));
  right: 14px;
}
.dr > :deep(.ppanel) {
  width: min(92vw, 420px);
}
.dr__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.dr__title {
  margin: 0;
  font-family: var(--f-chalk);
  font-size: 32px;
  line-height: 1.1;
}
.who {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.who img {
  width: 76px;
  height: 76px;
  flex-shrink: 0;
  animation: pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.quote {
  flex: 1;
  background: #fff;
  border: 3px solid var(--c-dark);
  border-radius: 14px;
  padding: 6px 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  font-weight: 800;
  font-size: 15px;
  line-height: 1.25;
}
.quote::before {
  content: '';
  position: absolute;
  left: -11px;
  top: 50%;
  margin-top: -8px;
  border: 8px solid transparent;
  border-right-color: var(--c-dark);
  border-left: 0;
}
.quote small {
  font-weight: 900;
  font-size: 12px;
  opacity: 0.7;
}
.acc {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}
.acc span {
  font-weight: 800;
  opacity: 0.8;
}
.acc b {
  font-size: 54px;
  font-weight: 1000;
}
.stars {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
.stars img {
  width: 38px;
  height: 38px;
  animation: pop 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) backwards;
}
.metrics {
  width: 100%;
  display: grid;
  gap: 6px;
}
.metrics > div {
  display: grid;
  grid-template-columns: 76px 1fr auto;
  align-items: center;
  gap: 8px;
  background: rgba(59, 36, 22, 0.07);
  border-radius: 10px;
  padding: 6px 10px;
  font-weight: 800;
}
.metrics i {
  font-style: normal;
  letter-spacing: 1px;
  font-size: 18px;
}
.metrics small {
  font-weight: 800;
  opacity: 0.75;
  white-space: nowrap;
}
.chips {
  display: flex;
  gap: 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 3px solid var(--c-dark);
  border-radius: 999px;
  padding: 3px 12px;
  font-weight: 900;
  background: #fff3e0;
}
.chip img {
  width: 20px;
  height: 20px;
}
.pct {
  margin: 2px 0 0;
  font-weight: 800;
  text-align: center;
  color: var(--c-good);
  min-height: 1.3em;
}
.next {
  margin: 0;
  font-weight: 700;
  font-size: 14px;
  opacity: 0.75;
}
.dr__buttons {
  width: min(92vw, 420px);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
@keyframes pop {
  from {
    transform: scale(0.3);
    opacity: 0;
  }
}
</style>
