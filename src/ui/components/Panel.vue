<script setup lang="ts">
/** ui_panel görselini 9-slice (border-image) olarak kullanan kâğıt panel. */
import { computed } from 'vue'
import { ThemeService } from '@/services/theme/ThemeService'

const style = computed(() => {
  const url = ThemeService.url('ui_panel')
  return url ? { borderImage: `url("${url}") 92 fill / 30px stretch` } : {}
})
</script>

<template>
  <div class="ppanel" :style="style">
    <div class="ppanel__inner"><slot /></div>
  </div>
</template>

<style scoped>
.ppanel {
  width: 100%;
  border: 30px solid transparent;
  background: transparent;
  filter: drop-shadow(0 8px 0 rgba(30, 14, 4, 0.55));
  display: flex;
  min-height: 0;
}
.ppanel__inner {
  margin: -8px;
  padding: 4px;
  width: calc(100% + 16px);
  overflow: auto;
  max-height: calc(100dvh - 120px - var(--safe-top) - var(--safe-bottom));
  color: var(--c-ink);
  -webkit-overflow-scrolling: touch;
}
</style>
