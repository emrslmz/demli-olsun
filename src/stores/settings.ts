import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bus } from '@/bus'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { defaultSave, type SettingsData } from '@/services/save/schema'

export const useSettingsStore = defineStore('settings', () => {
  const data = ref<SettingsData>({ ...defaultSave().settings })

  /** Ayarları servislere anında uygular. */
  function apply() {
    const s = data.value
    AudioService.setSettings({ music: s.music, musicVolume: s.musicVolume, sfx: s.sfx, sfxVolume: s.sfxVolume })
    HapticsService.enabled = s.haptics
    document.documentElement.classList.toggle('reduced-motion', s.reducedMotion)
    bus.emit('settings:changed')
  }

  function update(patch: Partial<SettingsData>) {
    data.value = { ...data.value, ...patch }
    apply()
  }

  return { data, apply, update }
})
