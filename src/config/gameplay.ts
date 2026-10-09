/**
 * Oynanış ayarları. Buradaki tüm sayılar başlangıç değerleridir; oyun testine göre ayarlanır.
 * Hacim birimi: bardak kapasitesinin oranı (0..1). Akış birimi: kapasite oranı / saniye.
 */

import type { GlassProfileId } from '@/core/glassModel'

export type PourSource = 'dem' | 'su'
export type GaugeMode = 'numbers' | 'marks' | 'none'

export interface FlowParams {
  /** En yüksek akış (kapasite oranı / sn). */
  maxFlow: number
  /** Basınca 0'dan en yüksek akışa çıkış süresi (sn). */
  rampUp: number
  /** Bırakınca artık akışın üstel sönüm sabiti τ (sn). */
  tau: number
}

export const POUR: Record<PourSource, FlowParams> = {
  dem: { maxFlow: 0.18, rampUp: 0.15, tau: 0.12 },
  su: { maxFlow: 0.32, rampUp: 0.12, tau: 0.09 },
}

export const POUR_TAIL = {
  /** Artık akış en yüksek akışın bu oranının altına inince akış çizgisi kopar, damlalar başlar. */
  cutoffRatio: 0.08,
  /** Kopuştan sonra düşen damla sayısı aralığı. */
  dropCount: [2, 3] as [number, number],
  /** Tek damlanın hacmi (kapasite oranı). */
  dropVolume: 0.0012,
  /** Damlalar arası süre aralığı (sn). */
  dropInterval: [0.07, 0.14] as [number, number],
  /** Fizik adımı (sn). Kare süresi bu boyda alt adımlara bölünür. */
  substep: 1 / 240,
}

/** Bardak kapasiteyi bu oranı aşınca taşar. */
export const OVERFLOW_AT = 1.0

export const SUGAR = {
  /** Her küpün eklediği hacim (kapasite oranı). */
  cubeVolume: 0.02,
  /** Her eksik ya da fazla küp için isabet cezası. */
  penaltyPerCube: 15,
  /** Şeker sayısı dağılımı (1, 2, 3 küp). */
  countWeights: [0.5, 0.35, 0.15],
}

export const SCORING = {
  /** Metrik puanı = max(0, 100 − k × hata). */
  k: 4,
  stars3: 95,
  stars2: 85,
  stars1: 70,
  /** Bu isabetin altında müşteri bardağı geri yollar ve can gider. */
  acceptMin: 50,
  comboThreshold: 85,
  comboStep: 0.1,
  comboMax: 2.0,
  basePoints: 100,
  gaugeMultiplier: { numbers: 1.0, marks: 1.2, none: 1.5 } as Record<GaugeMode, number>,
  /** Hız bonusu = kalan sabır oranı × bu değer. */
  speedBonus: 30,
  /** Muhtar taşmaya ekstra kızar: ek puan cezası. */
  muhtarOverflowPenalty: 100,
}

export const LIVES = 3

export interface StageConfig {
  stage: number
  /** Bu aşamanın başladığı servis sayısı. */
  fromServed: number
  patience: number
  gauge: GaugeMode
  glasses: GlassProfileId[]
  sugarChance: number
  queue: number
  trayAllowed: boolean
}

export const STAGES: StageConfig[] = [
  { stage: 1, fromServed: 0, patience: 25, gauge: 'numbers', glasses: ['ince'], sugarChance: 0, queue: 1, trayAllowed: false },
  { stage: 2, fromServed: 5, patience: 20, gauge: 'numbers', glasses: ['ince', 'duz'], sugarChance: 0.2, queue: 2, trayAllowed: false },
  { stage: 3, fromServed: 15, patience: 16, gauge: 'marks', glasses: ['ince', 'duz', 'kupa'], sugarChance: 0.35, queue: 3, trayAllowed: false },
  { stage: 4, fromServed: 30, patience: 13, gauge: 'marks', glasses: ['ince', 'duz', 'kupa', 'fincan'], sugarChance: 0.45, queue: 3, trayAllowed: false },
  { stage: 5, fromServed: 50, patience: 11, gauge: 'none', glasses: ['ince', 'duz', 'kupa', 'fincan'], sugarChance: 0.5, queue: 3, trayAllowed: true },
]

export const STAGE5 = {
  /** Aşama 5'te her servisle sabır bu kadar azalır… */
  patienceDecayPerServe: 0.05,
  /** …ama bunun altına inmez. */
  minPatience: 8,
}

/** Bardak tiplerinin seçilme ağırlıkları (açık olanlar arasından). */
export const GLASS_WEIGHTS: Record<GlassProfileId, number> = { ince: 4, duz: 2, kupa: 1.5, fincan: 1.2 }

export const PATIENCE = {
  /** Kuyrukta bekleyen (aktif olmayan) kartların sabır azalma hızı. */
  waitingRate: 0.35,
  /** Bu oranın altında kart titrer, müşteri ikonu kızarır. */
  warnBelow: 0.2,
  /** Taksicinin sabır çarpanı (%40 daha kısa). */
  taksiciFactor: 0.6,
  /** Tepsi siparişinde bardak başına sabır çarpanı. */
  trayPerGlass: 0.75,
}

export const ARRIVAL = {
  /** Kuyrukta boş yer varken yeni siparişin gelme gecikmesi (sn). */
  delay: [1.2, 2.6] as [number, number],
  /** Mesai başında ilk sipariş gecikmesi (sn). */
  firstDelay: 0.8,
}

export const RUSH = {
  /** Yoğun saat süresi (sn). */
  duration: 20,
  /** Puan çarpanı. */
  multiplier: 1.5,
  /** Gelme gecikmesi çarpanı (siparişler sıklaşır). */
  arrivalFactor: 0.45,
  /** İki yoğun saat arası servis sayısı aralığı. */
  everyServes: [9, 14] as [number, number],
  /** Yoğun saat bu aşamadan önce başlamaz. */
  minStage: 2,
  /** Yoğun saatte kuyruk kapasitesine eklenen kart (tablo genişliğiyle sınırlı). */
  extraQueue: 1,
  names: ['Öğle arası', 'Maç akşamı', 'Pazar kalabalığı', 'İkindi çayı'],
}

export const TRAY = {
  glasses: [3, 4] as [number, number],
  /** Aşama 5'te esnafın tepsi siparişi verme olasılığı. */
  chance: 0.8,
}

export const ANIM = {
  /** Döküm sırasında demliğin eğilme açısı (derece). */
  potTilt: 35,
  potTiltIn: 0.16,
  potTiltOut: 0.28,
  /** Karışma girdabı süresi (sn). */
  mixSwirl: [0.3, 0.5] as [number, number],
  /** Servis sonrası yeni bardak gelişi (sn). */
  serveSlide: 0.45,
}

export const DEV = {
  /** İlk 5 sn ortalama FPS bunun altındaysa düşük kaliteye geçilir. */
  lowFpsThreshold: 50,
  lowFpsWindow: 5,
}
