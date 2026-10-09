<script setup lang="ts">
/**
 * Geliştirici menüsü (yalnızca geliştirme sürümünde ya da logoya 5 kez dokununca, mock servislerle).
 * Bahşiş, kayıt sıfırlama, aşama/gösterge zorlama, sahte reklam/satın alma senaryoları,
 * saat kaydırma (günlük sipariş ve lig haftası), tema değiştirme, debug katmanı, anchor düzenleyici.
 */
import { computed, ref } from 'vue'
import { bus } from '@/bus'
import { clockOffsetDays, resetClock, shiftDays } from '@/app/clock'
import { resetSave } from '@/app/flow'
import { effectiveThemeSetting } from '@/app/bootstrap'
import { THEME_IDS, type ThemeSetting } from '@/config/theme'
import type { GaugeMode } from '@/config/gameplay'
import { services } from '@/services'
import type { MockAdScenario } from '@/services/ads/MockAdService'
import type { MockPurchaseScenario } from '@/services/iap/MockPurchaseService'
import { ThemeService } from '@/services/theme/ThemeService'
import { useAppStore } from '@/stores/app'
import { useDailyStore } from '@/stores/daily'
import { useEconomyStore } from '@/stores/economy'
import { useInventoryStore } from '@/stores/inventory'
import { saveNow } from '@/stores/persist'
import { useSettingsStore } from '@/stores/settings'
import GameButton from '@/ui/components/GameButton.vue'
import Modal from '@/ui/components/Modal.vue'

const app = useAppStore()
const econ = useEconomyStore()
const inv = useInventoryStore()
const daily = useDailyStore()
const settings = useSettingsStore()
const overlay = ref(false)
const anchors = ref(false)
const offset = ref(clockOffsetDays())

const adMock = computed(() => services.ads.kind === 'mock')
const iapMock = computed(() => services.purchases.kind === 'mock')
const adScenario = ref<MockAdScenario>((services.ads as { scenario?: MockAdScenario }).scenario ?? 'success')
const iapScenario = ref<MockPurchaseScenario>((services.purchases as { scenario?: MockPurchaseScenario }).scenario ?? 'success')

function tips(n: number) {
  econ.add(n)
  void saveNow()
}

function boosters() {
  for (const b of ['ustaGozu', 'sabirTasi', 'yedekBardak'] as const) inv.addBooster(b, 3)
  void saveNow()
}

function stage(n: number) {
  bus.emit('dev:stage', n)
  app.showToast(`Aşama ${n} (mesai sırasında uygulanır)`)
}

function gauge(g: GaugeMode | null) {
  bus.emit('dev:gauge', g)
  app.showToast(`Gösterge: ${g ?? 'otomatik'}`)
}

function setAd(s: MockAdScenario) {
  adScenario.value = s
  ;(services.ads as unknown as { setScenario?: (x: MockAdScenario) => void }).setScenario?.(s)
}

function setIap(s: MockPurchaseScenario) {
  iapScenario.value = s
  ;(services.purchases as { scenario?: MockPurchaseScenario }).scenario = s
}

function clearIap() {
  ;(services.purchases as unknown as { clearStore?: () => void }).clearStore?.()
  app.showToast('Sahte mağaza sıfırlandı')
}

function days(n: number) {
  if (n === 0) resetClock()
  else shiftDays(n)
  offset.value = clockOffsetDays()
  daily.refreshToday()
  app.showToast(`Saat kayması: ${offset.value} gün`)
}

function resetDailyLogin() {
  daily.loginLastDay = null
  void saveNow()
  app.open('dailyReward')
}

async function theme(t: ThemeSetting) {
  settings.update({ theme: t })
  await saveNow()
  await ThemeService.setTheme(effectiveThemeSetting())
}

function toggleOverlay() {
  overlay.value = !overlay.value
  bus.emit('dev:overlay', overlay.value)
}

function toggleAnchors() {
  anchors.value = !anchors.value
  bus.emit('dev:anchors', anchors.value)
  if (anchors.value) app.open(null)
}

function starterNow() {
  app.flags = { ...app.flags, starterOfferAt: Date.now() }
  void saveNow()
  app.open('starterOffer')
}

function reset() {
  app.confirm('Kayıt tamamen silinsin mi?', () => void resetSave())
}
</script>

<template>
  <Modal title="Geliştirici" wide @close="app.open(null)">
    <div class="dev">
      <section>
        <h3>Ekonomi</h3>
        <div class="btns">
          <GameButton size="small" @click="tips(1000)">+1.000 bahşiş</GameButton>
          <GameButton size="small" @click="tips(10000)">+10.000</GameButton>
          <GameButton size="small" @click="boosters">+3 güçlendirici</GameButton>
          <GameButton size="small" @click="resetDailyLogin">Giriş ödülü</GameButton>
          <GameButton size="small" @click="starterNow">Başlangıç teklifi</GameButton>
        </div>
      </section>
      <section>
        <h3>Mesai</h3>
        <div class="btns">
          <GameButton v-for="n in 5" :key="n" size="small" @click="stage(n)">Aşama {{ n }}</GameButton>
        </div>
        <div class="btns">
          <GameButton size="small" @click="gauge('numbers')">Rakam</GameButton>
          <GameButton size="small" @click="gauge('marks')">İşaret</GameButton>
          <GameButton size="small" @click="gauge('none')">Göz kararı</GameButton>
          <GameButton size="small" @click="gauge(null)">Otomatik</GameButton>
        </div>
        <div class="btns">
          <GameButton size="small" :variant="overlay ? 'accent' : 'default'" @click="toggleOverlay">Debug katmanı</GameButton>
          <GameButton size="small" :variant="anchors ? 'accent' : 'default'" @click="toggleAnchors">Anchor düzenleyici</GameButton>
        </div>
      </section>
      <section>
        <h3>Saat (kayma: {{ offset }} gün)</h3>
        <div class="btns">
          <GameButton size="small" @click="days(-1)">−1 gün</GameButton>
          <GameButton size="small" @click="days(1)">+1 gün</GameButton>
          <GameButton size="small" @click="days(7)">+1 hafta (lig)</GameButton>
          <GameButton size="small" @click="days(0)">Sıfırla</GameButton>
        </div>
      </section>
      <section v-if="adMock">
        <h3>Sahte reklam</h3>
        <div class="btns">
          <GameButton
            v-for="s in ['success', 'cancel', 'fail'] as MockAdScenario[]"
            :key="s"
            size="small"
            :variant="adScenario === s ? 'accent' : 'default'"
            @click="setAd(s)"
          >
            {{ { success: 'Başarılı', cancel: 'İptal', fail: 'Yüklenemedi' }[s] }}
          </GameButton>
        </div>
      </section>
      <section v-if="iapMock">
        <h3>Sahte satın alma</h3>
        <div class="btns">
          <GameButton
            v-for="s in ['success', 'cancel', 'error', 'noPrices'] as MockPurchaseScenario[]"
            :key="s"
            size="small"
            :variant="iapScenario === s ? 'accent' : 'default'"
            @click="setIap(s)"
          >
            {{ { success: 'Başarılı', cancel: 'İptal', error: 'Hata', noPrices: 'Fiyat yok' }[s] }}
          </GameButton>
          <GameButton size="small" @click="clearIap">Mağazayı sıfırla</GameButton>
        </div>
      </section>
      <section>
        <h3>Tema ({{ ThemeService.state.active }})</h3>
        <div class="btns">
          <GameButton size="small" :variant="settings.data.theme === 'auto' ? 'accent' : 'default'" @click="theme('auto')"
            >Otomatik</GameButton
          >
          <GameButton
            v-for="t in THEME_IDS"
            :key="t"
            size="small"
            :variant="settings.data.theme === t ? 'accent' : 'default'"
            @click="theme(t)"
          >
            {{ t }}
          </GameButton>
        </div>
      </section>
      <section>
        <div class="btns">
          <GameButton size="small" variant="primary" @click="reset">Kaydı sıfırla</GameButton>
        </div>
      </section>
    </div>
  </Modal>
</template>

<style scoped>
.dev {
  overflow-y: auto;
  max-height: 64vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
h3 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 900;
}
.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.btns :deep(.btn) {
  font-size: 13px;
  min-height: 40px;
  padding: 6px 10px;
}
</style>
