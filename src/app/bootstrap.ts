/**
 * Uygulama açılışı: platform servisleri, kayıt, ayarlar, tema. Phaser bu adımlardan sonra monte edilir.
 */

import { Capacitor } from '@capacitor/core'
import { bus } from '@/bus'
import { ACTIVE_THEME, resolveThemeSetting } from '@/config/theme'
import { initServiceImplementations, services } from '@/services'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { initBackButton } from '@/services/platform/backButton'
import { initLifecycle } from '@/services/platform/lifecycle'
import { initSafeArea } from '@/services/platform/safeArea'
import { ThemeService } from '@/services/theme/ThemeService'
import { hydrateStores, saveNow } from '@/stores/persist'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { tr } from '@/i18n/tr'

export function effectiveThemeSetting(): ReturnType<typeof resolveThemeSetting> {
  const s = useSettingsStore().data.theme
  return resolveThemeSetting(s !== 'auto' ? s : ACTIVE_THEME)
}

export async function bootstrap(): Promise<void> {
  initSafeArea()
  await Promise.all([initLifecycle(), initBackButton(), initServiceImplementations()])

  const loaded = await services.save.load()
  if (loaded.error) console.warn('[boot] Kayıt kurtarıldı:', loaded.source, loaded.error)
  hydrateStores(loaded.data)
  useSettingsStore().apply()
  await ThemeService.setTheme(effectiveThemeSetting(), false)

  // Bağlantı durumu: çevrimdışıyken liderlik/lig/satın alma gizlenir; açık ekran liderlikse menüye dönülür.
  const app = useAppStore()
  const setOnline = (on: boolean) => {
    if (app.online === on) return
    app.online = on
    if (!on) {
      app.showToast(tr.errors.offline)
      if (app.screen === 'leaderboard') app.go('menu')
    }
  }
  window.addEventListener('online', () => setOnline(true))
  window.addEventListener('offline', () => setOnline(false))

  // İlk dokunuşta AudioContext.resume().
  const unlock = () => AudioService.unlock()
  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock, { passive: true })

  bus.on('audio:sfx', (name) => AudioService.play(name))
  bus.on('haptic', (e) => HapticsService.trigger(e))
  bus.on('app:background', () => {
    AudioService.setBackgrounded(true)
    void saveNow()
  })
  bus.on('app:foreground', () => AudioService.setBackgrounded(false))

  if (Capacitor.isNativePlatform()) {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar')
      await StatusBar.setStyle({ style: Style.Dark })
      if (Capacitor.getPlatform() === 'android') {
        // Bazı Android WebView'ları env(safe-area-inset-top) için 0 döndürür; durum çubuğu oyunun üstüne binerse
        // HUD ve başlıklar altında kalır. Bu yüzden Android'de oyun durum çubuğunun altından başlar.
        await StatusBar.setOverlaysWebView({ overlay: false })
        await StatusBar.setBackgroundColor({ color: '#2A1408' })
      }
    } catch {
      /* setOverlaysWebView / setBackgroundColor yalnızca Android'de */
    }
  }
}

export async function hideNativeSplash(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide({ fadeOutDuration: 250 })
  } catch {
    /* yok say */
  }
}
