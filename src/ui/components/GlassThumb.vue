<script setup lang="ts">
/** Çarşı kartı için küçük ince belli bardak çizimi: cam rengi, ağız rengi ve desen skin'den gelir. */
import { computed } from 'vue'
import { glassSkin } from '@/data/cosmetics'
import { ThemeService } from '@/services/theme/ThemeService'

const props = defineProps<{ id: string }>()
const skin = computed(() => glassSkin(props.id))
const decal = computed(() => (skin.value.decal ? ThemeService.url(skin.value.decal) : ''))
const uid = `gt${Math.random().toString(36).slice(2, 8)}`
// Lale profili: ağız → bel → karın → dip
const body = 'M12 8 C12 26 21 36 21 46 C21 56 13 62 13 72 C13 80 18 84 30 84 C42 84 47 80 47 72 C47 62 39 56 39 46 C39 36 48 26 48 8 Z'
</script>

<template>
  <svg class="gt" viewBox="0 0 60 96" aria-hidden="true">
    <defs>
      <clipPath :id="`${uid}c`"><path :d="body" /></clipPath>
      <linearGradient :id="`${uid}t`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#C2501F" />
        <stop offset="1" stop-color="#7A240E" />
      </linearGradient>
    </defs>
    <ellipse cx="30" cy="88" rx="24" ry="5" fill="rgba(59,36,22,.25)" />
    <path :d="body" :fill="skin.glass" :fill-opacity="skin.glassAlpha + 0.3" />
    <g :clip-path="`url(#${uid}c)`">
      <rect x="0" y="22" width="60" height="70" :fill="`url(#${uid}t)`" />
      <ellipse cx="30" cy="22" rx="16" ry="2.6" fill="#E07A3A" opacity=".8" />
      <image v-if="decal" :href="decal" x="14" y="48" width="32" height="32" opacity=".95" preserveAspectRatio="xMidYMid meet" />
      <path d="M17 12 C17 26 24 36 24 46" stroke="#fff" stroke-width="2.5" fill="none" opacity=".55" stroke-linecap="round" />
    </g>
    <path :d="body" fill="none" :stroke="skin.outline" stroke-width="2.6" stroke-linejoin="round" />
    <ellipse cx="30" cy="8" rx="18" ry="3.2" :fill="skin.rim" :stroke="skin.outline" stroke-width="2" />
    <rect x="17" y="82" width="26" height="4" rx="2" :fill="skin.outline" opacity=".85" />
  </svg>
</template>

<style scoped>
.gt {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
