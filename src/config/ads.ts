/** Reklam sıklık kuralları ve reklam birimi kimlikleri. */

export const INTERSTITIAL_RULES = {
  /** Ömür boyu tamamlanan mesai en az bu kadar olmalı. */
  minLifetimeShifts: 3,
  /** Son geçiş reklamından bu yana en az bu kadar mesai… */
  minShiftsBetween: 2,
  /** …ve en az bu kadar saniye geçmiş olmalı. */
  minSecondsBetween: 120,
  /** Son bu kadar saniyede ödüllü reklam izlenmişse geçiş reklamı gösterilmez. */
  rewardedCooldownSec: 60,
}

/** Ödüllü reklam yerleşimleri. */
export type RewardedPlacement = 'continue' | 'doubleTips' | 'freeBooster'

/** Google'ın resmi test kimlikleri. Geliştirmede yalnızca bunlar kullanılır. */
export const ADMOB_TEST_IDS = {
  android: {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/9214589741',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    appId: 'ca-app-pub-3940256099942544~1458002511',
    banner: 'ca-app-pub-3940256099942544/2435281174',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
} as const

export interface AdUnitIds {
  banner: string
  interstitial: string
  rewarded: string
  testing: boolean
}

/**
 * Platforma göre reklam birimi kimliklerini döndürür.
 * Yalnızca `vite build` (mode=production) gerçek kimlikleri kullanır; geliştirme sunucusu ve
 * `npm run build:debug` (mode=debug) daima Google test kimlikleriyle çalışır. `.env` boşsa yine test kimlikleri.
 */
export function getAdUnitIds(platform: 'android' | 'ios'): AdUnitIds {
  const test = ADMOB_TEST_IDS[platform]
  const env = import.meta.env
  const isRelease = import.meta.env.PROD && import.meta.env.MODE === 'production'
  const real =
    platform === 'android'
      ? {
          banner: env.VITE_ADMOB_BANNER_ANDROID,
          interstitial: env.VITE_ADMOB_INTERSTITIAL_ANDROID,
          rewarded: env.VITE_ADMOB_REWARDED_ANDROID,
        }
      : {
          banner: env.VITE_ADMOB_BANNER_IOS,
          interstitial: env.VITE_ADMOB_INTERSTITIAL_IOS,
          rewarded: env.VITE_ADMOB_REWARDED_IOS,
        }
  const useReal = isRelease && !!real.banner && !!real.interstitial && !!real.rewarded
  if (!useReal) {
    return { banner: test.banner, interstitial: test.interstitial, rewarded: test.rewarded, testing: true }
  }
  return {
    banner: real.banner as string,
    interstitial: real.interstitial as string,
    rewarded: real.rewarded as string,
    testing: false,
  }
}

export const FORCE_MOCK_ADS = import.meta.env.VITE_FORCE_MOCK_ADS === 'true'
