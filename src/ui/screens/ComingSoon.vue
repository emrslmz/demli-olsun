<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import TopBar from '@/ui/components/TopBar.vue'
const app = useAppStore()
</script>

<template>
  <div class="cs">
    <TopBar :title="app.screen" @back="app.go('menu')" />
    <p>Bu ekran sonraki fazda geliyor.</p>
  </div>
</template>

<style scoped>
.cs {
  position: absolute;
  inset: 0;
  background: rgba(24, 12, 4, 0.6);
  color: #fff6e6;
}
.cs p {
  text-align: center;
  font-weight: 800;
}
</style>
