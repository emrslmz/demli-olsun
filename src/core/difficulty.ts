/** Zorluk aşamaları (Bölüm 6.4). */

import { PATIENCE, STAGE5, STAGES, type GaugeMode, type StageConfig } from '@/config/gameplay'

export function stageFor(served: number): StageConfig {
  let current = STAGES[0] as StageConfig
  for (const s of STAGES) if (served >= s.fromServed) current = s
  return current
}

/** Aşamanın temel sabrı; aşama 5'te her servisle azalır, en az 8 sn. */
export function basePatience(served: number): number {
  const s = stageFor(served)
  if (s.stage < 5) return s.patience
  const extra = (served - s.fromServed) * STAGE5.patienceDecayPerServe
  return Math.max(STAGE5.minPatience, s.patience - extra)
}

export function orderPatience(served: number, customerFactor: number, trayGlasses = 1): number {
  const base = basePatience(served) * customerFactor
  if (trayGlasses <= 1) return base
  return base * trayGlasses * PATIENCE.trayPerGlass
}

/**
 * Efektif gösterge modu. Renk körlüğü modu ve Usta Gözü güçlendiricisi göstergeyi her zaman rakamlı yapar
 * (çarpan da 1.0 olur).
 */
export function effectiveGauge(stageGauge: GaugeMode, opts: { colorBlind?: boolean; ustaGozu?: boolean }): GaugeMode {
  if (opts.colorBlind || opts.ustaGozu) return 'numbers'
  return stageGauge
}
