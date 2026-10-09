import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BoosterId } from '@/config/economy'
import type { CosmeticKind } from '@/data/cosmetics'

export const useInventoryStore = defineStore('inventory', () => {
  const owned = ref<string[]>(['glass:klasik', 'pot:celik', 'venue:mahalle'])
  const equipped = ref<Record<CosmeticKind, string>>({ glass: 'klasik', pot: 'celik', venue: 'mahalle' })
  const boosters = ref<Record<BoosterId, number>>({ ustaGozu: 0, sabirTasi: 0, yedekBardak: 0 })

  function key(kind: CosmeticKind, id: string): string {
    return `${kind}:${id}`
  }

  function isOwned(kind: CosmeticKind, id: string): boolean {
    return owned.value.includes(key(kind, id))
  }

  function own(kind: CosmeticKind, id: string) {
    if (!isOwned(kind, id)) owned.value = [...owned.value, key(kind, id)]
  }

  function equip(kind: CosmeticKind, id: string): boolean {
    if (!isOwned(kind, id)) return false
    equipped.value = { ...equipped.value, [kind]: id }
    return true
  }

  function addBooster(id: BoosterId, n = 1) {
    boosters.value = { ...boosters.value, [id]: (boosters.value[id] ?? 0) + n }
  }

  function useBooster(id: BoosterId): boolean {
    if ((boosters.value[id] ?? 0) <= 0) return false
    boosters.value = { ...boosters.value, [id]: boosters.value[id] - 1 }
    return true
  }

  return { owned, equipped, boosters, isOwned, own, equip, addBooster, useBooster }
})
