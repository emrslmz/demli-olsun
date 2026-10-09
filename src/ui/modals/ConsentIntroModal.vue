<script setup lang="ts">
/** Eğitimden sonra, reklam onay penceresinden önce kısa bilgilendirme (Bölüm 11.1). */
import { ref } from 'vue'
import { tr } from '@/i18n/tr'
import { services } from '@/services'
import { ThemeService } from '@/services/theme/ThemeService'
import { useAppStore } from '@/stores/app'
import { saveNow } from '@/stores/persist'
import GameButton from '@/ui/components/GameButton.vue'
import Modal from '@/ui/components/Modal.vue'

const app = useAppStore()
const busy = ref(false)

async function next() {
  if (busy.value) return
  busy.value = true
  try {
    await services.ads.runConsentFlow()
  } catch (err) {
    console.warn('[consent] akış tamamlanamadı', err)
  } finally {
    app.flags = { ...app.flags, consentDone: true }
    await saveNow()
    busy.value = false
    app.open(null)
  }
}
</script>

<template>
  <Modal :title="tr.consent.title" :closable="false">
    <div class="ci">
      <img :src="ThemeService.url('icon_ad')" alt="" />
      <p>{{ tr.consent.body }}</p>
    </div>
    <div class="col">
      <GameButton variant="primary" size="big" :disabled="busy" @click="next">{{ tr.consent.continue }}</GameButton>
    </div>
  </Modal>
</template>

<style scoped>
.ci {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  line-height: 1.35;
}
.ci img {
  width: 64px;
  height: 64px;
}
.ci p {
  margin: 0 0 14px;
}
.col {
  display: flex;
  flex-direction: column;
}
</style>
