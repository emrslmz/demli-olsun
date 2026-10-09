/**
 * Tema servisi: manifest'leri yükler, görsel kimliğini dosya yoluna çözer (default'a fallback dahil),
 * paleti Vue CSS değişkenlerine ve Phaser renk sabitlerine aktarır, temanın dekor ve partikül listesini verir.
 * Tema değişince 'theme:changed' yayınlanır; Phaser eski texture'ları kaldırıp sahneyi yeniden başlatır.
 */

import { reactive } from 'vue'
import { bus } from '@/bus'
import { BASE_PALETTE, THEME_IDS, type Palette, type ThemeId } from '@/config/theme'

export interface AssetMeta {
  file: string
  w: number
  h: number
  counterY?: number
  pivot?: [number, number]
  spout?: [number, number]
  slice?: [number, number, number, number]
  blend?: 'add'
}

export interface ThemeManifest {
  theme: ThemeId
  version: number
  palette: Palette
  assets: Record<string, AssetMeta>
  extras?: { deco?: string[]; particles?: string[] }
}

export interface ResolvedAsset {
  id: string
  url: string
  meta: AssetMeta
  theme: ThemeId
}

export type PaletteInt = Record<keyof Palette, number>

export function hexToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

export function paletteToInt(p: Palette): PaletteInt {
  return {
    primary: hexToInt(p.primary),
    accent: hexToInt(p.accent),
    warm: hexToInt(p.warm),
    metal: hexToInt(p.metal),
    dark: hexToInt(p.dark),
    light: hexToInt(p.light),
  }
}

/** Zemin rengine göre okunaklı yazı rengi (açık zeminde koyu mürekkep). */
export function onColor(hex: string): string {
  const n = hexToInt(hex)
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return L > 0.42 ? '#3B2416' : '#FFF6E6'
}

const assetBase = (theme: ThemeId): string => `${import.meta.env.BASE_URL}assets/themes/${theme}/`

class ThemeServiceImpl {
  readonly state = reactive({
    active: 'default' as ThemeId,
    palette: { ...BASE_PALETTE } as Palette,
    /** Her tema değişiminde artar; Vue görselleri yeniden çözsün diye. */
    version: 0,
    ready: false,
  })

  private readonly manifests = new Map<ThemeId, ThemeManifest>()
  private paletteIntCache: PaletteInt = paletteToInt(BASE_PALETTE)

  async loadManifest(id: ThemeId): Promise<ThemeManifest | null> {
    const cached = this.manifests.get(id)
    if (cached) return cached
    try {
      const res = await fetch(`${assetBase(id)}manifest.json`)
      if (!res.ok) return null
      const m = (await res.json()) as ThemeManifest
      this.manifests.set(id, m)
      return m
    } catch (err) {
      console.warn(`[theme] ${id} manifest'i yüklenemedi`, err)
      return null
    }
  }

  /** Temayı etkinleştirir. Phaser hazırsa 'theme:changed' ile texture'lar yenilenir. */
  async setTheme(id: ThemeId, notify = true): Promise<void> {
    const target = THEME_IDS.includes(id) ? id : 'default'
    await this.loadManifest('default')
    const m = target === 'default' ? this.manifests.get('default') : await this.loadManifest(target)
    const active: ThemeId = m ? target : 'default'
    const palette = (m ?? this.manifests.get('default'))?.palette ?? BASE_PALETTE
    const changed = active !== this.state.active || !this.state.ready
    this.state.active = active
    this.state.palette = { ...BASE_PALETTE, ...palette }
    this.paletteIntCache = paletteToInt(this.state.palette)
    this.applyCssVars()
    this.state.version++
    this.state.ready = true
    if (changed && notify) bus.emit('theme:changed', active)
  }

  get active(): ThemeId {
    return this.state.active
  }

  get palette(): Palette {
    return this.state.palette
  }

  get paletteInt(): PaletteInt {
    return this.paletteIntCache
  }

  private applyCssVars(): void {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const p = this.state.palette
    root.style.setProperty('--c-primary', p.primary)
    root.style.setProperty('--c-accent', p.accent)
    root.style.setProperty('--c-warm', p.warm)
    root.style.setProperty('--c-metal', p.metal)
    root.style.setProperty('--c-dark', p.dark)
    root.style.setProperty('--c-light', p.light)
    root.style.setProperty('--c-on-primary', onColor(p.primary))
    root.style.setProperty('--c-on-accent', onColor(p.accent))
    root.style.setProperty('--c-on-warm', onColor(p.warm))
    root.style.setProperty('--c-on-metal', onColor(p.metal))
    root.dataset.theme = this.state.active
  }

  /** Görsel kimliğini aktif temada, yoksa default'ta arar. */
  resolve(id: string): ResolvedAsset | null {
    const active = this.manifests.get(this.state.active)
    const a = active?.assets[id]
    if (a && active) return { id, url: assetBase(active.theme) + a.file, meta: a, theme: active.theme }
    const def = this.manifests.get('default')
    const d = def?.assets[id]
    if (d) return { id, url: assetBase('default') + d.file, meta: d, theme: 'default' }
    return null
  }

  /** Vue <img> için URL. Bulunamazsa boş string. */
  url(id: string): string {
    void this.state.version
    return this.resolve(id)?.url ?? ''
  }

  meta(id: string): AssetMeta | null {
    return this.resolve(id)?.meta ?? null
  }

  /** Aktif temanın yalnızca kendine ait dekor ve partikülleri. */
  extras(): { deco: string[]; particles: string[] } {
    const m = this.manifests.get(this.state.active)
    if (!m || this.state.active === 'default') return { deco: [], particles: [] }
    return { deco: m.extras?.deco ?? [], particles: m.extras?.particles ?? [] }
  }

  /** Yüklenmesi gereken tüm görsel kimlikleri (default + aktif tema, fallback çözülmüş). */
  allAssetIds(filter?: (id: string) => boolean): string[] {
    const ids = new Set<string>()
    for (const id of Object.keys(this.manifests.get('default')?.assets ?? {})) ids.add(id)
    for (const id of Object.keys(this.manifests.get(this.state.active)?.assets ?? {})) ids.add(id)
    return [...ids].filter((id) => (filter ? filter(id) : true))
  }
}

export const ThemeService = new ThemeServiceImpl()
