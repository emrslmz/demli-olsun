import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  const id = ref('')
  const nickname = ref('')
  const createdAt = ref(0)

  function setNickname(name: string) {
    nickname.value = name.trim()
  }

  return { id, nickname, createdAt, setNickname }
})
