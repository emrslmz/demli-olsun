<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { restorePurchases, resetSave, startTutorial } from '@/app/flow'
import { tr } from '@/i18n/tr'
import { services } from '@/services'
import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'
import { saveNow } from '@/stores/persist'
import { useSettingsStore } from '@/stores/settings'
import type { SettingsData } from '@/services/save/schema'
import GameButton from '@/ui/components/GameButton.vue'
import Panel from '@/ui/components/Panel.vue'
import ToggleRow from '@/ui/components/ToggleRow.vue'
import TopBar from '@/ui/components/TopBar.vue'
import Onboarding from './Onboarding.vue'
import { toggleNotifications } from '@/app/notifications'

const app = useAppStore()
const settings = useSettingsStore()
const player = usePlayerStore()
const editingName = ref(false)
const privacyRequired = ref(true)
const version = __APP_VERSION__
const s = computed(() => settings.data)

onMounted(async () => {
  privacyRequired.value = await services.ads.privacyOptionsRequired()
})

function set<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
  settings.update({ [key]: value } as Partial<SettingsData>)
  void saveNow()
}

function onName(name: string) {
  player.setNickname(name)
  editingName.value = false
  void saveNow()
  app.showToast(`Artık herkes sana "${name}" diyecek.`)
}

function privacy() {
  const url = import.meta.env.VITE_PRIVACY_URL
  if (url) window.open(url, '_blank')
}

function reset() {
  app.confirm(tr.settings.resetConfirm, () => void resetSave(), tr.common.yes, tr.common.no)
}

async function notif(v: boolean) {
  const ok = await toggleNotifications(v)
  if (v && !ok) app.showToast('Bildirim izni verilmedi. Cihaz ayarlarından açabilirsin.')
}
</script>

<template>
  <div class="scr">
    <TopBar :title="tr.settings.title" @back="app.go('menu')" />
    <div class="scr__body">
      <Panel>
        <div class="list">
          <ToggleRow :label="tr.settings.music" :model-value="s.music" @update:model-value="set('music', $event)" />
          <input
            class="slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="s.musicVolume"
            :disabled="!s.music"
            @input="set('musicVolume', Number(($event.target as HTMLInputElement).value))"
          />
          <ToggleRow :label="tr.settings.sfx" :model-value="s.sfx" @update:model-value="set('sfx', $event)" />
          <input
            class="slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="s.sfxVolume"
            :disabled="!s.sfx"
            @input="set('sfxVolume', Number(($event.target as HTMLInputElement).value))"
          />
          <ToggleRow :label="tr.settings.haptics" :model-value="s.haptics" @update:model-value="set('haptics', $event)" />
          <ToggleRow :label="tr.settings.reducedMotion" :model-value="s.reducedMotion" @update:model-value="set('reducedMotion', $event)" />
          <ToggleRow
            :label="tr.settings.colorBlind"
            :desc="tr.settings.colorBlindDesc"
            :model-value="s.colorBlind"
            @update:model-value="set('colorBlind', $event)"
          />
          <ToggleRow :label="tr.settings.lowQuality" :model-value="s.lowQuality" @update:model-value="set('lowQuality', $event)" />
          <ToggleRow :label="tr.settings.notifications" :model-value="s.notifications" @update:model-value="notif" />
          <label v-if="s.notifications" class="hour">
            <span>{{ tr.settings.notifyHour }}</span>
            <select
              :value="s.notifyHour"
              @change="
                set('notifyHour', Number(($event.target as HTMLSelectElement).value))
                notif(true)
              "
            >
              <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
            </select>
          </label>
        </div>
        <div class="buttons">
          <GameButton @click="editingName = true">{{ tr.settings.nickname }}: {{ player.nickname }}</GameButton>
          <GameButton @click="startTutorial">{{ tr.settings.tutorial }}</GameButton>
          <GameButton @click="restorePurchases">{{ tr.settings.restore }}</GameButton>
          <GameButton v-if="privacyRequired" @click="services.ads.showPrivacyOptions()">{{ tr.settings.adPrefs }}</GameButton>
          <GameButton @click="privacy">{{ tr.settings.privacy }}</GameButton>
          <GameButton variant="primary" @click="reset">{{ tr.settings.reset }}</GameButton>
        </div>
        <p class="ver">{{ tr.settings.version }} {{ version }}</p>
      </Panel>
    </div>
    <Onboarding v-if="editingName" editing @done="onName" @cancel="editingName = false" />
  </div>
</template>

<style scoped>
.scr {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: rgba(24, 12, 4, 0.55);
}
.scr__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 14px calc(16px + var(--safe-bottom));
  display: flex;
  justify-content: center;
}
.scr__body > :deep(.ppanel) {
  width: min(100%, 480px);
  height: fit-content;
}
.list {
  display: flex;
  flex-direction: column;
}
.list > .row + .row,
.list > .slider + .row {
  border-top: 2px dashed rgba(59, 36, 22, 0.18);
}
.slider {
  width: 100%;
  accent-color: var(--c-warm);
  margin: 0 0 8px;
  height: 28px;
}
.hour {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  padding: 6px 4px 10px;
}
.hour select {
  font: inherit;
  font-weight: 800;
  padding: 6px 10px;
  border-radius: 10px;
  border: 3px solid var(--c-dark);
  background: #fffaf0;
}
.buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}
.ver {
  text-align: center;
  margin: 14px 0 0;
  font-weight: 700;
  opacity: 0.6;
}
</style>
