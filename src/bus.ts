/**
 * Tipli olay yolu. Vue ve Phaser yalnızca bu bus ve Pinia store'lar üzerinden konuşur.
 * Phaser her karede Pinia'ya yazmaz; sadece olay yayınlar.
 */

import mitt from 'mitt'
import type { GaugeMode } from '@/config/gameplay'
import type { ThemeId } from '@/config/theme'
import type { BoosterId } from '@/config/economy'
import type { CustomerId } from '@/data/customers'
import type { SfxName } from '@/services/audio/sfx'
import type { HapticEvent } from '@/services/haptics/HapticsService'
import type { DailyChallenge } from '@/core/daily'

export type GameMode = 'shift' | 'daily' | 'tutorial'

export interface ShiftStartOptions {
  mode: 'shift'
  boosters: BoosterId[]
}

export interface DailyStartOptions {
  mode: 'daily'
  challenge: DailyChallenge
}

export interface TutorialStartOptions {
  mode: 'tutorial'
}

export type GameStartOptions = ShiftStartOptions | DailyStartOptions | TutorialStartOptions

export interface ShiftResult {
  score: number
  served: number
  /** Kabul edilen servislerin ortalama isabeti. */
  avgAccuracy: number
  tipsEarned: number
  bestCombo: number
  stars3: number
  stage: number
  durationSec: number
  continued: boolean
}

export interface DailyResultData {
  dateKey: string
  dayNumber: number
  customer: CustomerId
  accuracy: number
  demScore: number
  fillScore: number
  stars: number
  accepted: boolean
  line: string
  timeSec: number
  /** Gerçekleşen değerler (sonuç kartı için). */
  demPct: number
  fillPct: number
  targetDem: number
  targetFill: number
  sugarGiven: number
  sugarTarget: number
  tips: number
}

export interface ContinueOffer {
  /** Ödüllü reklamla devam hakkı kullanılabilir mi. */
  adAvailable: boolean
  cost: number
}

export type CosmeticPreview =
  | { kind: 'glass'; id: string }
  | { kind: 'pot'; id: string }
  | { kind: 'venue'; id: string }
  | null

export type Events = {
  /** Phaser hazır (BootScene bitti). */
  'game:booted': void
  /** Vue → Phaser: oyun başlat. */
  'game:start': GameStartOptions
  /** Phaser → Vue: oyuncu duraklat düğmesine bastı. */
  'game:pause-request': void
  /** Vue → Phaser: duraklat / devam ettir. */
  'game:pause': void
  'game:resume': void
  /** Vue → Phaser: oyundan çık, ortam sahnesine dön. */
  'game:quit': void
  /** Vue → Phaser: mesaiyi şimdi bitir (puan kaydedilir). */
  'game:end-request': void
  /** Phaser → Vue: canlar bitti, devam teklifi göster. */
  'game:continue-offer': ContinueOffer
  /** Vue → Phaser: devam kararı. */
  'game:continue': { granted: boolean; viaAd: boolean }
  /** Phaser → Vue: mesai bitti. */
  'game:over': ShiftResult
  /** Phaser → Vue: günlük sipariş bitti. */
  'daily:finished': DailyResultData
  /** Phaser → Vue: eğitim bitti ya da atlandı. */
  'tutorial:finished': { skipped: boolean }
  /** Phaser → Vue: bir servis tamamlandı (kayıt/istatistik için hafif olay). */
  'shift:served': { accuracy: number; stars: number; tips: number }
  /** Ses efekti iste. */
  'audio:sfx': SfxName
  /** Titreşim iste. */
  'haptic': HapticEvent
  /** Tema değişti; Phaser texture'ları yeniden yükler. */
  'theme:changed': ThemeId
  /** Kuşanılan kozmetik değişti ya da önizleme istendi. */
  'cosmetic:preview': CosmeticPreview
  'cosmetic:equipped': void
  /** Ortam sahnesinin modu (menüde büyük bardak, çarşıda önizleme). */
  'ambient:mode': 'menu' | 'preview'
  /** Geliştirici menüsü. */
  'dev:overlay': boolean
  'dev:stage': number
  'dev:gauge': GaugeMode | null
  'dev:anchors': boolean
  /** Reklam ya da satın alma ekranı açık: oyun döngüsü ve ses duraklasın. */
  'app:interrupt': boolean
  /** Ayarlar değişti (hareket azaltma, renk körlüğü vb.). */
  'settings:changed': void
  /** Uygulama arka plana geçti / öne geldi. */
  'app:background': void
  'app:foreground': void
}

export const bus = mitt<Events>()
