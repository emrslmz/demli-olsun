<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import GameButton from '@/ui/components/GameButton.vue'
import Modal from '@/ui/components/Modal.vue'

const app = useAppStore()
function yes() {
  const s = app.confirmState
  app.open(null)
  s?.onYes()
}
</script>

<template>
  <Modal v-if="app.confirmState" @close="app.open(null)">
    <p class="msg">{{ app.confirmState.text }}</p>
    <div class="row">
      <GameButton @click="app.open(null)">{{ app.confirmState.no }}</GameButton>
      <GameButton variant="primary" @click="yes">{{ app.confirmState.yes }}</GameButton>
    </div>
  </Modal>
</template>

<style scoped>
.msg {
  margin: 4px 0 16px;
  text-align: center;
  font-weight: 800;
  font-size: 18px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
