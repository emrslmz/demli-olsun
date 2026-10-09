/** Phaser tarafının paylaşılan çalışma durumu: boyut, DPR, yerleşim, kalite. */

import type { Insets } from '@/services/platform/safeArea'
import { ThemeService } from '@/services/theme/ThemeService'
import { computeLayout, DEFAULT_BG_SIZES, type BgSizes, type Layout } from './layout'

export const MAX_DPR = 2
export const LOW_QUALITY_DPR = 1.5

export const runtime = {
  cssW: 390,
  cssH: 844,
  dpr: 1,
  safe: { top: 0, right: 0, bottom: 0, left: 0 } as Insets,
  lowQuality: false,
  layout: null as Layout | null,
  /** Seçili mekan (bg_<venue>_phone/tablet). */
  venue: 'mahalle',
}

export function targetDpr(): number {
  const dev = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return Math.min(dev, runtime.lowQuality ? LOW_QUALITY_DPR : MAX_DPR)
}

export function bgSizesFor(venue: string): BgSizes {
  const p = ThemeService.meta(`bg_${venue}_phone`)
  const t = ThemeService.meta(`bg_${venue}_tablet`)
  return {
    phone: p ? { w: p.w, h: p.h, counterY: p.counterY ?? 0.68 } : DEFAULT_BG_SIZES.phone,
    tablet: t ? { w: t.w, h: t.h, counterY: t.counterY ?? 0.68 } : DEFAULT_BG_SIZES.tablet,
  }
}

export function recomputeLayout(): Layout {
  const W = Math.round(runtime.cssW * runtime.dpr)
  const H = Math.round(runtime.cssH * runtime.dpr)
  runtime.layout = computeLayout(W, H, runtime.dpr, runtime.safe, bgSizesFor(runtime.venue))
  return runtime.layout
}

export function getLayout(): Layout {
  return runtime.layout ?? recomputeLayout()
}
