<script setup lang="ts">
import { tr } from '@/i18n/tr'
import { ThemeService } from '@/services/theme/ThemeService'
</script>

<template>
  <div class="splash">
    <img v-if="ThemeService.state.ready" class="splash__logo" :src="ThemeService.url('logo_emblem')" alt="" />
    <h1 class="splash__title">{{ tr.appName }}</h1>
    <p class="splash__tag chalk">{{ tr.splash.tagline }}</p>
  </div>
</template>

<style scoped>
.splash {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: radial-gradient(circle at 50% 40%, #2a5f9e 0%, var(--c-primary) 45%, #14325c 100%);
  color: #fff6e6;
  z-index: 50;
}
.splash__logo {
  width: min(56vw, 300px);
  height: auto;
  animation: bob 1.8s ease-in-out infinite;
}
.splash__title {
  margin: 0;
  font-size: clamp(40px, 11vw, 64px);
  font-weight: 1000;
  letter-spacing: 0.5px;
  text-shadow:
    0 4px 0 var(--c-dark),
    0 0 18px rgba(0, 0, 0, 0.25);
  -webkit-text-stroke: 2px var(--c-dark);
}
.splash__tag {
  margin: 0;
  font-size: 22px;
  opacity: 0.9;
}
@keyframes bob {
  50% {
    transform: translateY(-10px) rotate(-2deg);
  }
}
</style>
