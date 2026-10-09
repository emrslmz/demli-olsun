<script setup lang="ts">
/** Bahşiş sayacı: değer değişince sayarak ilerler. */
import { onBeforeUnmount, ref, watch } from 'vue'
import { num } from '@/i18n/tr'
import { ThemeService } from '@/services/theme/ThemeService'

const props = defineProps<{ value: number }>()
const shown = ref(props.value)
let raf = 0

watch(
  () => props.value,
  (v) => {
    cancelAnimationFrame(raf)
    const start = shown.value
    const t0 = performance.now()
    const dur = Math.min(900, 200 + Math.abs(v - start) * 2)
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      shown.value = Math.round(start + (v - start) * (1 - (1 - k) * (1 - k)))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  },
)
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="coins">
    <img :src="ThemeService.url('icon_coin')" alt="" />
    <span>{{ num(shown) }}</span>
  </div>
</template>

<style scoped>
.coins {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px 4px 6px;
  border-radius: 999px;
  background: rgba(30, 43, 36, 0.86);
  border: 3px solid var(--c-dark);
  color: #fff6e6;
  font-weight: 900;
  font-size: 20px;
  box-shadow: 0 3px 0 var(--c-dark);
}
.coins img {
  width: 30px;
  height: 30px;
}
</style>
