import { defineStore } from 'pinia'
import { ref } from 'vue'
import { weekId as currentWeekId, type TierId } from '@/core/league'

export const useLeagueStore = defineStore('league', () => {
  const weekId = ref<string | null>(null)
  const tier = ref<TierId>('mahalle')
  const weeklyScore = ref(0)
  const lastRank = ref<number | null>(null)

  /** Mesai puanını haftalık toplama ekler (hafta değiştiyse önce sıfırlar). */
  function addShiftScore(score: number, now = new Date()) {
    const w = currentWeekId(now)
    if (weekId.value !== w) {
      weekId.value = w
      weeklyScore.value = 0
    }
    weeklyScore.value += Math.max(0, Math.round(score))
  }

  function startWeek(w: string, newTier: TierId) {
    weekId.value = w
    tier.value = newTier
    weeklyScore.value = 0
    lastRank.value = null
  }

  return { weekId, tier, weeklyScore, lastRank, addShiftScore, startWeek }
})
