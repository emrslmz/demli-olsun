import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { now } from '@/app/clock'
import { DAILY_LOGIN_REWARDS } from '@/config/economy'
import { addDays, istanbulDateKey, nextDailyStreak } from '@/core/daily'
import type { DailyHistoryEntry } from '@/services/save/schema'

export const useDailyStore = defineStore('daily', () => {
  const lastPlayedDay = ref<string | null>(null)
  const streak = ref(0)
  const bestStreak = ref(0)
  const history = ref<DailyHistoryEntry[]>([])
  const loginLastDay = ref<string | null>(null)
  const loginIndex = ref(0)
  /** Saat değişimini izlemek için dışarıdan güncellenen "bugün". */
  const today = ref(istanbulDateKey(now()))

  const playedToday = computed(() => lastPlayedDay.value === today.value)
  const todayEntry = computed(() => history.value.find((h) => h.day === today.value) ?? null)

  function refreshToday() {
    today.value = istanbulDateKey(now())
  }

  function recordPlay(entry: DailyHistoryEntry) {
    streak.value = nextDailyStreak(lastPlayedDay.value, streak.value, entry.day)
    bestStreak.value = Math.max(bestStreak.value, streak.value)
    lastPlayedDay.value = entry.day
    history.value = [entry, ...history.value.filter((h) => h.day !== entry.day)].slice(0, 60)
  }

  /** Bugünkü giriş ödülü bekliyor mu? Bekliyorsa gün indeksi ve miktarı. */
  const pendingLogin = computed(() => {
    if (loginLastDay.value === today.value) return null
    const continues = loginLastDay.value !== null && addDays(loginLastDay.value, 1) === today.value
    const index = continues ? (loginIndex.value + 1) % DAILY_LOGIN_REWARDS.length : 0
    return { index, amount: DAILY_LOGIN_REWARDS[index] as number }
  })

  function claimLogin(): number {
    const p = pendingLogin.value
    if (!p) return 0
    loginIndex.value = p.index
    loginLastDay.value = today.value
    return p.amount
  }

  return {
    lastPlayedDay,
    streak,
    bestStreak,
    history,
    loginLastDay,
    loginIndex,
    today,
    playedToday,
    todayEntry,
    pendingLogin,
    refreshToday,
    recordPlay,
    claimLogin,
  }
})
