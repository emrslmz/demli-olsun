<script setup lang="ts">
import { ThemeService } from '@/services/theme/ThemeService'
defineProps<{ id: string; size?: number }>()
</script>

<template>
  <img :src="ThemeService.url(id)" alt="" :style="size ? { width: `${size}px`, height: `${size}px` } : undefined" />
</template>
