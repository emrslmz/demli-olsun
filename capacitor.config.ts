import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.demliolsun.app',
  appName: 'Demli Olsun',
  webDir: 'dist',
  backgroundColor: '#1F4E8C',
  ios: {
    contentInset: 'never',
    backgroundColor: '#1F4E8C',
  },
  plugins: {
    // Android 15+ edge-to-edge: viewport-fit=cover ile WebView kenardan kenara çizilir,
    // inset'ler CSS env(safe-area-inset-*) ile okunur (eski Chromium'da WebView dolgulanır, env 0 olur).
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 3000,
      backgroundColor: '#1F4E8C',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
    LocalNotifications: {
      iconColor: '#1F4E8C',
    },
  },
}

export default config
