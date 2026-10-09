<script setup lang="ts">
/** 7 günlük giriş ödülü şeridi. Bir gün kaçarsa başa döner. */
import { computed, ref } from 'vue'
import { DAILY_LOGIN_REWARDS } from '@/config/economy'
import { fmt, num, tr } from '@/i18n/tr'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { ThemeService } from '@/services/theme/ThemeService'
import { useAppStore } from '@/stores/app'
import { useDailyStore } from '@/stores/daily'
import { useEconomyStore } from '@/stores/economy'
import { saveNow } from '@/stores/persist'
import GameButton from '@/ui/components/GameButton.vue'
import Modal from '@/ui/components/Modal.vue'

const app = useAppStore()
const daily = useDailyStore()
const econ = useEconomyStore()
const pending = daily.pendingLogin
const index = pending?.index ?? 0
const claimed = ref(false)

const days = computed(() =>
  DAILY_LOGIN_REWARDS.map((amount, i) => ({
    i,
    amount,
    state: i < index || (i === index && claimed.value) ? 'done' : i === index ? 'today' : 'next',
  })),
)

function claim() {
  if (claimed.value) return
  const amount = daily.claimLogin()
  claimed.value = true
  if (amount > 0) {
    econ.add(amount)
    AudioService.play('coin')
    HapticsService.trigger('purchase')
  }
  void saveNow()
  setTimeout(() => app.open(null), 900)
}
</script>

<template>
  <Modal :title="tr.dailyReward.title" wide :closable="claimed" @close="app.open(null)">
    <div class="strip">
      <div v-for="d in days" :key="d.i" class="day" :class="[d.state, { last: d.i === days.length - 1 }]">
        <span class="day__n">{{ fmt(tr.dailyReward.day, { n: d.i + 1 }) }}</span>
        <img :src="ThemeService.url(d.i === days.length - 1 ? 'icon_gift' : 'icon_coin')" alt="" />
        <b>{{ num(d.amount) }}</b>
        <span v-if="d.state === 'done'" class="tick">✓</span>
      </div>
    </div>
    <p class="note">{{ tr.dailyReward.missed }}</p>
    <div class="col">
      <GameButton variant="primary" size="big" :disabled="claimed" @click="claim">
        <img :src="ThemeService.url('icon_coin')" alt="" />
        {{ tr.dailyReward.claim }} +{{ num(pending?.amount ?? 0) }}
      </GameButton>
    </div>
  </Modal>
</template>

<style scoped>
.strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.day {
  position: relative;
  background: rgba(255, 255, 255, 0.55);
  border: 3px solid rgba(59, 36, 22, 0.3);
  border-radius: 14px;
  padding: 6px 4px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-weight: 900;
}
.day.last {
  grid-column: span 2;
  background: linear-gradient(135deg, #fff6d8, #f6e2a8);
  border-color: var(--c-metal);
}
.day img {
  width: 34px;
  height: 34px;
}
.day__n {
  font-size: 12px;
  opacity: 0.8;
}
.day.today {
  border-color: var(--c-warm);
  background: #fff3e0;
  animation: bob 1.1s ease-in-out infinite;
  box-shadow: 0 0 0 3px rgba(139, 30, 15, 0.2);
}
.day.done {
  opacity: 0.55;
}
.tick {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--c-good);
  text-shadow: 0 2px 0 #fff;
  animation: stamp 300ms cubic-bezier(0.2, 1.6, 0.4, 1);
}
@keyframes bob {
  50% {
    transform: translateY(-3px);
  }
}
@keyframes stamp {
  from {
    transform: scale(2);
    opacity: 0;
  }
}
.note {
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  margin: 10px 0;
}
.col {
  display: flex;
  flex-direction: column;
}
</style>
