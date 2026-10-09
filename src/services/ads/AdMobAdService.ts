/**
 * AdMob uygulaması (@capacitor-community/admob).
 * Sıra: Google UMP onay akışı (gerekiyorsa) → iOS'ta App Tracking Transparency → AdMob initialize.
 * Kişiselleştirme onayı UMP/TCF üzerinden SDK'ya iletilir; reddedilirse SDK kişiselleştirilmemiş reklam gösterir.
 */

import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob'
import { getAdUnitIds, type AdUnitIds, type RewardedPlacement } from '@/config/ads'
import { Listeners } from '../emitter'
import type { AdEvent, AdService, RewardOutcome } from './AdService'

const RETRY_DELAYS = [5000, 15000, 30000, 60000]

export class AdMobAdService implements AdService {
  readonly kind = 'admob' as const
  private readonly ids: AdUnitIds
  private readonly platform: 'android' | 'ios'
  private initialized = false
  private removed = false
  private rewardedReady = false
  private interstitialReady = false
  private rewardedLoading = false
  private interstitialLoading = false
  private rewardedRetry = 0
  private interstitialRetry = 0
  private privacyRequired = false
  private bannerVisible = false
  private readonly listeners = new Listeners<AdEvent>()
  private readonly handles: PluginListenerHandle[] = []

  constructor() {
    this.platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
    this.ids = getAdUnitIds(this.platform)
  }

  async init(): Promise<void> {
    // Gerçek başlatma runConsentFlow içinde: onaydan önce reklam isteği yapılmaz.
  }

  async runConsentFlow(): Promise<void> {
    if (this.initialized) return
    try {
      const info = await AdMob.requestConsentInfo()
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
        await AdMob.showConsentForm()
      }
      const after = await AdMob.requestConsentInfo()
      this.privacyRequired = String(after.privacyOptionsRequirementStatus) === 'REQUIRED'
    } catch (err) {
      console.warn('[ads] UMP onay akışı başarısız', err)
    }
    if (this.platform === 'ios') {
      try {
        const s = await AdMob.trackingAuthorizationStatus()
        if (s.status === 'notDetermined') await AdMob.requestTrackingAuthorization()
      } catch (err) {
        console.warn('[ads] ATT isteği başarısız', err)
      }
    }
    try {
      await AdMob.initialize({ initializeForTesting: this.ids.testing })
      this.initialized = true
      await this.attachListeners()
      void this.loadRewarded()
      void this.loadInterstitial()
    } catch (err) {
      console.warn('[ads] AdMob başlatılamadı', err)
    }
  }

  async privacyOptionsRequired(): Promise<boolean> {
    return this.privacyRequired
  }

  async showPrivacyOptions(): Promise<void> {
    try {
      await AdMob.showPrivacyOptionsForm()
    } catch (err) {
      console.warn('[ads] Gizlilik formu açılamadı', err)
    }
  }

  private async attachListeners(): Promise<void> {
    this.handles.push(
      await AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        this.rewardedReady = true
        this.rewardedLoading = false
        this.rewardedRetry = 0
        this.emitAvailability()
      }),
      await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
        this.rewardedReady = false
        this.rewardedLoading = false
        this.emitAvailability()
        this.scheduleRetry('rewarded')
      }),
      await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        this.interstitialReady = true
        this.interstitialLoading = false
        this.interstitialRetry = 0
        this.emitAvailability()
      }),
      await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
        this.interstitialReady = false
        this.interstitialLoading = false
        this.emitAvailability()
        this.scheduleRetry('interstitial')
      }),
      await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
        this.listeners.emit({ type: 'banner', height: this.bannerVisible ? size.height : 0 })
      }),
    )
  }

  private scheduleRetry(kind: 'rewarded' | 'interstitial'): void {
    const n = kind === 'rewarded' ? this.rewardedRetry++ : this.interstitialRetry++
    const delay = RETRY_DELAYS[Math.min(n, RETRY_DELAYS.length - 1)] as number
    setTimeout(() => void (kind === 'rewarded' ? this.loadRewarded() : this.loadInterstitial()), delay)
  }

  private async loadRewarded(): Promise<void> {
    if (!this.initialized || this.rewardedReady || this.rewardedLoading) return
    this.rewardedLoading = true
    try {
      await AdMob.prepareRewardVideoAd({ adId: this.ids.rewarded, isTesting: this.ids.testing })
    } catch {
      this.rewardedLoading = false
    }
  }

  private async loadInterstitial(): Promise<void> {
    if (!this.initialized || this.removed || this.interstitialReady || this.interstitialLoading) return
    this.interstitialLoading = true
    try {
      await AdMob.prepareInterstitial({ adId: this.ids.interstitial, isTesting: this.ids.testing })
    } catch {
      this.interstitialLoading = false
    }
  }

  private emitAvailability(): void {
    this.listeners.emit({
      type: 'availability',
      rewarded: this.isRewardedReady(),
      interstitial: this.isInterstitialReady(),
    })
  }

  isRewardedReady(): boolean {
    return this.initialized && this.rewardedReady
  }

  isInterstitialReady(): boolean {
    return this.initialized && !this.removed && this.interstitialReady
  }

  async showRewarded(_placement: RewardedPlacement): Promise<RewardOutcome> {
    if (!this.isRewardedReady()) return 'unavailable'
    let rewarded = false
    const subs: PluginListenerHandle[] = []
    const done = new Promise<void>((resolve) => {
      void (async () => {
        subs.push(
          await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
            rewarded = true
          }),
          await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => resolve()),
          await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => resolve()),
        )
      })()
    })
    this.rewardedReady = false
    this.listeners.emit({ type: 'fullscreen', open: true })
    let failed = false
    try {
      await AdMob.showRewardVideoAd()
      await done
    } catch {
      failed = true
    }
    for (const s of subs) void s.remove()
    this.listeners.emit({ type: 'fullscreen', open: false })
    this.emitAvailability()
    void this.loadRewarded()
    if (failed && !rewarded) return 'failed'
    return rewarded ? 'rewarded' : 'dismissed'
  }

  async showInterstitial(): Promise<boolean> {
    if (!this.isInterstitialReady()) return false
    const subs: PluginListenerHandle[] = []
    const done = new Promise<void>((resolve) => {
      void (async () => {
        subs.push(
          await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => resolve()),
          await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => resolve()),
        )
      })()
    })
    this.interstitialReady = false
    this.listeners.emit({ type: 'fullscreen', open: true })
    let shown = true
    try {
      await AdMob.showInterstitial()
      await done
    } catch {
      shown = false
    }
    for (const s of subs) void s.remove()
    this.listeners.emit({ type: 'fullscreen', open: false })
    this.emitAvailability()
    void this.loadInterstitial()
    return shown
  }

  async showBanner(): Promise<void> {
    if (!this.initialized || this.removed || this.bannerVisible) return
    try {
      this.bannerVisible = true
      await AdMob.showBanner({
        adId: this.ids.banner,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: this.ids.testing,
      })
    } catch (err) {
      this.bannerVisible = false
      console.warn('[ads] Banner gösterilemedi', err)
    }
  }

  async hideBanner(): Promise<void> {
    if (!this.bannerVisible) return
    this.bannerVisible = false
    try {
      await AdMob.removeBanner()
    } catch {
      /* zaten kapalı */
    }
    this.listeners.emit({ type: 'banner', height: 0 })
  }

  setAdsRemoved(removed: boolean): void {
    this.removed = removed
    if (removed) {
      void this.hideBanner()
      this.interstitialReady = false
    } else {
      void this.loadInterstitial()
    }
    this.emitAvailability()
  }

  on(fn: (e: AdEvent) => void): () => void {
    return this.listeners.on(fn)
  }
}
