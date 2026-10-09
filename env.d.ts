/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORCE_MOCK_ADS?: string
  readonly VITE_FORCE_MOCK_IAP?: string
  readonly VITE_LEADERBOARD_MODE?: string
  readonly VITE_ADMOB_APP_ID_ANDROID?: string
  readonly VITE_ADMOB_APP_ID_IOS?: string
  readonly VITE_ADMOB_REWARDED_ANDROID?: string
  readonly VITE_ADMOB_REWARDED_IOS?: string
  readonly VITE_ADMOB_INTERSTITIAL_ANDROID?: string
  readonly VITE_ADMOB_INTERSTITIAL_IOS?: string
  readonly VITE_ADMOB_BANNER_ANDROID?: string
  readonly VITE_ADMOB_BANNER_IOS?: string
  readonly VITE_REVENUECAT_KEY_ANDROID?: string
  readonly VITE_REVENUECAT_KEY_IOS?: string
  readonly VITE_STORE_URL?: string
  readonly VITE_PRIVACY_URL?: string
  readonly VITE_ACTIVE_THEME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
