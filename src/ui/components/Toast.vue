<script setup lang="ts">
import { useAppStore } from '@/stores/app'
const app = useAppStore()
</script>

<template>
  <Transition name="toast">
    <div v-if="app.toast" :key="app.toast.id" class="toast">{{ app.toast.text }}</div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  top: calc(18px + var(--safe-top));
  transform: translateX(-50%);
  z-index: 500;
  max-width: min(90vw, 420px);
  background: var(--c-board);
  color: var(--c-chalk);
  border: 3px solid var(--c-dark);
  border-radius: 14px;
  padding: 10px 16px;
  font-weight: 800;
  text-align: center;
  box-shadow: 0 4px 0 var(--c-dark);
  pointer-events: none;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 200ms,
    transform 200ms;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
