import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STARTING_TIPS } from '@/config/economy'

export const useEconomyStore = defineStore('economy', () => {
  const tips = ref(STARTING_TIPS)
  /** Son eklemenin miktarı (sayaç animasyonu için). */
  const lastGain = ref(0)

  function add(amount: number) {
    if (amount <= 0) return
    tips.value += Math.round(amount)
    lastGain.value = Math.round(amount)
  }

  function canAfford(amount: number): boolean {
    return tips.value >= amount
  }

  function spend(amount: number): boolean {
    if (amount < 0 || tips.value < amount) return false
    tips.value -= amount
    return true
  }

  return { tips, lastGain, add, canAfford, spend }
})
