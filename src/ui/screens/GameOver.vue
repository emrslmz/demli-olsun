<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { doubleTips, gameOverToMenu, playAgain } from '@/app/flow'
import { num, pct1, tr } from '@/i18n/tr'
import { services } from '@/services'
import { ShareService } from '@/services/share/ShareService'
import { useAppStore } from '@/stores/app'
import { useSessionStore } from '@/stores/session'
import { ThemeService } from '@/services/theme/ThemeService'
import CoinCounter from '@/ui/components/CoinCounter.vue'
import GameButton from '@/ui/components/GameButton.vue'
import Panel from '@/ui/components/Panel.vue'
import { useEconomyStore } from '@/stores/economy'

const session = useSessionStore()
const app = useAppStore()
const econ = useEconomyStore()
const info = computed(() => session.gameOver)
const shownScore = ref(0)
const busy = ref(false)
const adReady = ref(services.ads.isRewardedReady())

onMounted(() => {
  const target = info.value?.result.score ?? 0
  const t0 = performance.now()
  const dur = Math.min(1600, 400 + target / 10)
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / dur)
    shownScore.value = Math.round(target * (1 - Math.pow(1 - k, 3)))
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
})

async function onDouble() {
  busy.value = true
  await doubleTips()
  busy.value = false
  adReady.value = services.ads.isRewardedReady()
}

async function share() {
  const r = info.value?.result
  if (!r) return
  const text = `Demli Olsun'da mesaiyi ${num(r.score)} puanla kapattım! ☕ ${r.served} servis, ortalama isabet %${pct1(r.avgAccuracy)}.\n${import.meta.env.VITE_STORE_URL ?? ''}`
  const out = await ShareService.share(text)
  if (out === 'copied') app.showToast('Sonuç panoya kopyalandı.')
}

const rankText = computed(() => {
  const i = info.value
  if (!i || i.rankBefore === null || i.rankAfter === null) return ''
  return `${i.rankBefore}. → ${i.rankAfter}.`
})
</script>

<template>
  <div v-if="info" class="go">
    <div class="go__top"><CoinCounter :value="econ.tips" /></div>
    <Panel>
      <div class="go__body">
        <h1 class="go__title">{{ tr.gameOver.title }}</h1>
        <div v-if="info.newRecord" class="badge">{{ tr.gameOver.newRecord }}</div>
        <div class="score">{{ num(shownScore) }}</div>
        <div class="stats">
          <div>
            <span>{{ tr.gameOver.served }}</span
            ><b>{{ info.result.served }}</b>
          </div>
          <div>
            <span>{{ tr.gameOver.avgAccuracy }}</span
            ><b>%{{ pct1(info.result.avgAccuracy) }}</b>
          </div>
          <div>
            <span>{{ tr.gameOver.bestCombo }}</span
            ><b>{{ info.result.bestCombo }}</b>
          </div>
          <div>
            <span>{{ tr.gameOver.tipsEarned }}</span>
            <b class="tips"><img :src="ThemeService.url('icon_coin')" alt="" />{{ num(info.tipsAwarded * (info.doubled ? 2 : 1)) }}</b>
          </div>
          <div v-if="rankText">
            <span>{{ tr.gameOver.league }}</span
            ><b>{{ rankText }}</b>
          </div>
        </div>
        <p v-if="info.titleUp" class="title-up">
          Yeni unvan: <b>{{ info.titleUp }}</b> 🎉
        </p>
        <GameButton
          v-if="info.tipsAwarded > 0 && !info.doubled"
          variant="accent"
          icon="icon_ad"
          :disabled="busy || !adReady"
          @click="onDouble"
        >
          {{ adReady ? tr.gameOver.doubleTips : tr.common.adUnavailable }}
        </GameButton>
        <p v-else-if="info.doubled" class="doubled">{{ tr.gameOver.doubled }}</p>
      </div>
    </Panel>
    <div class="go__buttons">
      <GameButton variant="primary" size="big" @click="playAgain">{{ tr.gameOver.again }}</GameButton>
      <div class="row">
        <GameButton @click="gameOverToMenu">{{ tr.gameOver.menu }}</GameButton>
        <GameButton variant="blue" icon="icon_share" @click="share">{{ tr.gameOver.share }}</GameButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.go {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: calc(16px + var(--safe-top)) 16px calc(16px + var(--safe-bottom));
  background: rgba(24, 12, 4, 0.55);
}
.go__top {
  position: absolute;
  top: calc(12px + var(--safe-top));
  right: 14px;
}
.go > :deep(.ppanel) {
  width: min(92vw, 420px);
}
.go__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.go__title {
  margin: 0;
  font-family: var(--f-chalk);
  font-size: 34px;
}
.badge {
  background: var(--c-warm);
  color: #fff6e6;
  border: 3px solid var(--c-dark);
  border-radius: 999px;
  padding: 2px 14px;
  font-weight: 900;
  animation: pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1);
}
.score {
  font-size: 54px;
  font-weight: 1000;
  color: var(--c-ink);
  line-height: 1;
}
.stats {
  width: 100%;
  display: grid;
  gap: 6px;
  margin: 6px 0;
}
.stats > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(59, 36, 22, 0.07);
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
}
.stats b {
  font-weight: 900;
}
.tips {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tips img {
  width: 22px;
  height: 22px;
}
.title-up,
.doubled {
  margin: 0;
  font-weight: 800;
  color: var(--c-good);
}
.go__buttons {
  width: min(92vw, 420px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@keyframes pop {
  from {
    transform: scale(0.3);
  }
}
</style>
