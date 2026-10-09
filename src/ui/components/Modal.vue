<script setup lang="ts">
/** Modal: arka plan karartma + ahşap çerçeveli kâğıt panel. Android geri tuşu kapatır. */
import { onBeforeUnmount, onMounted } from 'vue'
import { pushBackHandler } from '@/services/platform/backButton'
import Panel from './Panel.vue'

const props = withDefaults(defineProps<{ title?: string; closable?: boolean; wide?: boolean }>(), {
  title: '',
  closable: true,
  wide: false,
})
const emit = defineEmits<{ close: [] }>()
let off: (() => void) | null = null

onMounted(() => {
  off = pushBackHandler(() => {
    if (props.closable) emit('close')
  })
})
onBeforeUnmount(() => off?.())
</script>

<template>
  <div class="modal" @pointerdown.self="closable && emit('close')">
    <div class="modal__box" :class="{ 'modal__box--wide': wide }">
      <Panel>
        <h2 v-if="title" class="modal__title">{{ title }}</h2>
        <slot />
      </Panel>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(24, 12, 4, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(16px + var(--safe-top)) 16px calc(16px + var(--safe-bottom));
}
.modal__box {
  width: min(92vw, 440px);
  max-height: 100%;
  display: flex;
}
.modal__box--wide {
  width: min(94vw, 560px);
}
.modal__title {
  margin: 0 0 12px;
  text-align: center;
  font-family: var(--f-chalk);
  font-weight: 700;
  font-size: 32px;
  line-height: 1.1;
  color: var(--c-ink);
}
</style>
