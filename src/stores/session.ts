/** Kaydedilmeyen oturum durumu: son mesai sonucu, devam teklifi, günlük sonuç. */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ContinueOffer, DailyResultData, GameMode, ShiftResult } from '@/bus'

export interface GameOverInfo {
  result: ShiftResult
  newRecord: boolean
  tipsAwarded: number
  doubled: boolean
  rankBefore: number | null
  rankAfter: number | null
  titleUp: string | null
}

export const useSessionStore = defineStore('session', () => {
  const gameOver = ref<GameOverInfo | null>(null)
  const continueOffer = ref<ContinueOffer | null>(null)
  const dailyResult = ref<DailyResultData | null>(null)
  const dailyPercentile = ref<number | null>(null)
  /** Tekrar butonu için son mesainin güçlendiricileri. */
  const lastBoosters = ref<string[]>([])
  /** Oynanan mod (duraklatma penceresi metinleri için). */
  const mode = ref<GameMode>('shift')
  return { gameOver, continueOffer, dailyResult, dailyPercentile, lastBoosters, mode }
})
