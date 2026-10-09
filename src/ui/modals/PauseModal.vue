<script setup lang="ts">
import { ref } from 'vue'
import { endShiftNow, resumeGame } from '@/app/flow'
import { tr } from '@/i18n/tr'
import { useSessionStore } from '@/stores/session'
import GameButton from '@/ui/components/GameButton.vue'
import Modal from '@/ui/components/Modal.vue'

const confirming = ref(false)
const daily = useSessionStore().mode === 'daily'
</script>

<template>
  <Modal :title="tr.pause.title" @close="resumeGame">
    <div v-if="!confirming" class="col">
      <GameButton variant="primary" size="big" @click="resumeGame">{{ tr.pause.resume }}</GameButton>
      <GameButton @click="confirming = true">{{ daily ? tr.pause.serveNow : tr.pause.quit }}</GameButton>
    </div>
    <div v-else class="col">
      <p class="msg">{{ daily ? tr.pause.dailyConfirm : tr.pause.quitConfirm }}</p>
      <GameButton variant="primary" @click="endShiftNow">{{ tr.common.yes }}</GameButton>
      <GameButton @click="confirming = false">{{ tr.common.no }}</GameButton>
    </div>
  </Modal>
</template>

<style scoped>
.col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.msg {
  margin: 0 0 4px;
  font-weight: 700;
  font-size: 17px;
  text-align: center;
}
</style>
