<script setup lang="ts">
/** Geçen haftanın lig sonucu. Ödül ve kademe değişimi zaten uygulandı; burada kutlanır. */
import { computed, onMounted } from 'vue'
import { tierDef, tierName } from '@/core/league'
import { fmt, num, tr } from '@/i18n/tr'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { ThemeService } from '@/services/theme/ThemeService'
import { useAppStore } from '@/stores/app'
import { useSessionStore } from '@/stores/session'
import GameButton from '@/ui/components/GameButton.vue'
import Modal from '@/ui/components/Modal.vue'

const app = useAppStore()
const session = useSessionStore()
const res = session.leagueResult

const title = computed(() => {
  if (!res) return ''
  const name = tierName(res.newTier)
  if (res.outcome === 'promoted') return fmt(tr.leagueResult.promoted, { name })
  if (res.outcome === 'demoted') return fmt(tr.leagueResult.demoted, { name })
  return fmt(tr.leagueResult.stayed, { name })
})

onMounted(() => {
  if (res?.outcome === 'promoted') {
    AudioService.play('leagueUp')
    HapticsService.trigger('stars3')
  } else if (res && res.reward > 0) AudioService.play('coin')
})

function close() {
  session.leagueResult = null
  app.open(null)
}
</script>

<template>
  <Modal v-if="res" :title="tr.leaderboard.tabs.weekly" @close="close">
    <div class="lr" :class="res.outcome">
      <div class="badges">
        <img v-if="res.outcome !== 'stayed'" class="old" :src="ThemeService.url(tierDef(res.tier).badge)" alt="" />
        <span v-if="res.outcome !== 'stayed'" class="arrow">{{ res.outcome === 'promoted' ? '➜' : '➘' }}</span>
        <img class="new" :src="ThemeService.url(tierDef(res.newTier).badge)" alt="" />
      </div>
      <h3>{{ title }}</h3>
      <p>{{ fmt(tr.leagueResult.rank, { n: res.rank }) }}</p>
      <p v-if="res.reward > 0" class="reward">
        <img :src="ThemeService.url('icon_coin')" alt="" />{{ fmt(tr.leagueResult.reward, { n: num(res.reward) }) }}
      </p>
      <i v-for="k in res.outcome === 'promoted' ? 14 : 0" :key="k" class="confetti" :style="{ '--k': k }" />
    </div>
    <div class="col">
      <GameButton variant="primary" size="big" @click="close">{{ tr.common.ok }}</GameButton>
    </div>
  </Modal>
</template>

<style scoped>
.lr {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  margin-bottom: 14px;
}
.badges {
  display: flex;
  align-items: center;
  gap: 10px;
}
.badges img {
  width: 84px;
  height: 84px;
}
.badges .old {
  width: 60px;
  height: 60px;
  opacity: 0.6;
}
.badges .new {
  animation: grow 0.7s cubic-bezier(0.2, 1.6, 0.4, 1) 0.2s backwards;
}
.arrow {
  font-size: 30px;
  font-weight: 900;
}
.promoted .arrow {
  color: var(--c-good);
}
.demoted .arrow {
  color: var(--c-bad);
}
h3 {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 1000;
}
p {
  margin: 0;
  font-weight: 800;
}
.reward {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 22px;
  color: var(--c-good);
}
.reward img {
  width: 30px;
  height: 30px;
}
.confetti {
  position: absolute;
  top: 30px;
  left: 50%;
  width: 10px;
  height: 14px;
  border-radius: 2px;
  background: hsl(calc(var(--k) * 37deg), 80%, 55%);
  animation: fly 1.4s ease-out calc(var(--k) * 30ms) both;
  pointer-events: none;
}
@keyframes fly {
  from {
    transform: translate(0, 0) rotate(0);
    opacity: 1;
  }
  to {
    transform: translate(calc((var(--k) - 7) * 22px), calc(-60px + (var(--k) % 4) * 50px)) rotate(calc(var(--k) * 70deg));
    opacity: 0;
  }
}
@keyframes grow {
  from {
    transform: scale(0.2) rotate(-30deg);
    opacity: 0;
  }
}
.col {
  display: flex;
  flex-direction: column;
}
</style>
