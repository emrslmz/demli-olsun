import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { TITLES } from '@/config/economy'

export const useProgressStore = defineStore('progress', () => {
  const totalServed = ref(0)
  const bestScore = ref(0)
  const shiftsPlayed = ref(0)
  const totalTipsEarned = ref(0)
  const bestCombo = ref(0)

  const title = computed(() => {
    let t: (typeof TITLES)[number] = TITLES[0]
    for (const x of TITLES) if (totalServed.value >= x.minServed) t = x
    return t
  })

  const nextTitle = computed(() => TITLES.find((x) => x.minServed > totalServed.value) ?? null)

  return { totalServed, bestScore, shiftsPlayed, totalTipsEarned, bestCombo, title, nextTitle }
})
