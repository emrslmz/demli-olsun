/**
 * Menülerdeyken arkada dönen sakin kahvehane sahnesi: tezgâhta buharı tüten büyük bir bardak çay,
 * iki yanda dinlenen demlik ve çaydanlık. Çarşıda kozmetikler burada canlı önizlenir (kamera kayar).
 */

import * as Phaser from 'phaser'
import { bus, type CosmeticPreview } from '@/bus'
import { glassSkin } from '@/data/cosmetics'
import { useInventoryStore } from '@/stores/inventory'
import { useSettingsStore } from '@/stores/settings'
import { bgId, ensureTextures, potIds } from '../assets'
import { Steam } from '../fx/Steam'
import type { Layout } from '../layout'
import { AnchorEditor } from '../objects/AnchorEditor'
import { Background } from '../objects/Background'
import { GlassView } from '../objects/GlassView'
import { ThemeFx } from '../objects/ThemeFx'
import { runtime } from '../runtime'
import { BaseScene } from './BaseScene'

export class AmbientScene extends BaseScene {
  private bg!: Background
  private themeFx!: ThemeFx
  private saucer!: Phaser.GameObjects.Image
  private glass!: GlassView
  private steam!: Steam
  private demlik!: Phaser.GameObjects.Image
  private caydanlik!: Phaser.GameObjects.Image
  private kettleSteam!: Steam
  private mode: 'menu' | 'preview' = 'menu'
  private shown = { glass: 'klasik', pot: 'celik', venue: 'mahalle' }
  /** Menünün bildirdiği boş alan (CSS px); yoksa varsayılan yerleşim. */
  private slot: { top: number; bottom: number } | null = null
  private hero = { baseY: 0, unit: 1, k: 1 }
  private anchorEditor: AnchorEditor | null = null

  constructor() {
    super('Ambient')
  }

  create() {
    this.setupBase()
    const L = this.L
    const inv = useInventoryStore()
    const reduced = useSettingsStore().data.reducedMotion
    this.mode = 'menu'
    this.shown = { ...inv.equipped }
    runtime.venue = this.shown.venue
    this.bg = new Background(this, this.shown.venue, L)
    this.themeFx = new ThemeFx(this, L, reduced || runtime.lowQuality)
    const pots = potIds(this.shown.pot)
    this.demlik = this.add
      .image(0, 0, this.textures.exists(pots.demlik) ? pots.demlik : 'pot_demlik_celik')
      .setOrigin(0.5, 0.95)
      .setDepth(8)
    this.caydanlik = this.add
      .image(0, 0, this.textures.exists(pots.caydanlik) ? pots.caydanlik : 'pot_caydanlik_celik')
      .setOrigin(0.5, 0.95)
      .setDepth(8)
      .setFlipX(true)
    this.saucer = this.add.image(0, 0, 'prop_tabak').setDepth(10)
    this.glass = new GlassView(this, 'ince', glassSkin(this.shown.glass))
    this.glass.container.setDepth(20)
    this.glass.setContents(0.86, 0.36, null)
    this.steam = new Steam(this, L.u * 1.3, { rate: reduced ? 0.5 : 1 })
    this.steam.setActive(true)
    this.kettleSteam = new Steam(this, L.u, { rate: 0.35, strength: 0.6, depth: 9 })
    this.kettleSteam.setActive(true)
    this.layoutAll(L)
    this.cameras.main.setScroll(0, 0)

    this.onBus('ambient:mode', (m) => this.setMode(m))
    this.onBus('cosmetic:preview', (p) => void this.preview(p))
    this.onBus('cosmetic:equipped', () => void this.preview(null))
    this.onBus('dev:anchors', (on) => this.setAnchorEditor(on))
    this.onBus('menu:hero-slot', (slot) => {
      this.slot = slot
      this.layoutAll(this.L)
    })
    bus.emit('menu:hero-request')
  }

  /**
   * Menü kahramanının yeri ve boyu. Varsayılan: tezgâhın arka kenarına yakın. Menü boş alanını bildirdiyse
   * bardak o alana sığacak şekilde küçülür ve butonların hemen üstüne oturur (kısa ekranlarda logo/buton altında kalmasın).
   */
  private heroFit(L: Layout): { baseY: number; unit: number; k: number } {
    const full = L.glassUnit * 1.05
    let baseY = L.counterY + (L.glassBaseY - L.counterY) * 0.5
    let unit = full
    if (this.slot) {
      const top = this.slot.top * L.dpr
      const bottom = this.slot.bottom * L.dpr
      baseY = Math.min(baseY, bottom - L.saucer.w * 0.16)
      // Bardak boyu ≈ 1.12 birim, üstüne buhar için pay.
      unit = Math.max(full * 0.55, Math.min(full, (baseY - top) / 1.25))
    }
    return { baseY, unit, k: unit / full }
  }

  /** Çarşıda kamera aşağı kayar: bardak ekranın üst kısmında, vitrinin üstünde görünür. */
  private previewScroll(L: Layout): number {
    const center = this.hero.baseY - this.hero.unit * 0.6
    return Math.max(0, center - L.H * 0.24)
  }

  private setMode(m: 'menu' | 'preview'): void {
    this.mode = m
    const target = m === 'preview' ? this.previewScroll(this.L) : 0
    this.tweens.add({ targets: this.cameras.main, scrollY: target, duration: 450, ease: 'Cubic.easeInOut' })
  }

  /** Kozmetik önizlemesi; null ise kuşanılanlara döner. */
  private async preview(p: CosmeticPreview): Promise<void> {
    const inv = useInventoryStore()
    const next = { ...inv.equipped }
    if (p?.kind === 'glass') next.glass = p.id
    if (p?.kind === 'pot') next.pot = p.id
    if (p?.kind === 'venue') next.venue = p.id
    if (next.pot !== this.shown.pot) {
      const ids = potIds(next.pot)
      await ensureTextures(this, [ids.demlik, ids.caydanlik])
      if (!this.sys.isActive()) return
      this.demlik.setTexture(ids.demlik)
      this.caydanlik.setTexture(ids.caydanlik)
      this.layoutAll(this.L)
      this.popIn([this.demlik, this.caydanlik])
    }
    if (next.venue !== this.shown.venue) {
      await ensureTextures(this, [bgId(next.venue, this.L.bg.variant)])
      if (!this.sys.isActive()) return
      runtime.venue = next.venue
      this.bg.setVenue(next.venue, this.L)
      this.bg.image.setAlpha(0)
      this.tweens.add({ targets: this.bg.image, alpha: 1, duration: 300 })
    }
    if (next.glass !== this.shown.glass) {
      const skin = glassSkin(next.glass)
      if (skin.decal) await ensureTextures(this, [skin.decal])
      if (!this.sys.isActive()) return
      this.glass.setType('ince', skin)
      this.glass.setContents(0.86, 0.36, null)
      this.glass.container.setDepth(20)
      this.layoutAll(this.L)
      this.popIn([this.glass.container])
    }
    this.shown = next
  }

  private popIn(targets: Phaser.GameObjects.Components.Transform[]): void {
    for (const t of targets) {
      const sx = t.scaleX
      const sy = t.scaleY
      t.setScale(sx * 0.85, sy * 0.85)
      this.tweens.add({ targets: t, scaleX: sx, scaleY: sy, duration: 260, ease: 'Back.easeOut' })
    }
  }

  private layoutAll(L: Layout): void {
    this.bg.layout(L)
    this.themeFx.layout(L)
    // Menü kahramanı: tezgâhın ortasında tabaklı büyük bir bardak çay, iki yanda dinlenen demlik ve çaydanlık.
    const h = this.heroFit(L)
    this.hero = h
    const sw = L.saucer.w * 1.15 * 1.05 * h.k
    this.saucer.setPosition(L.col.cx, h.baseY + 6 * L.u * h.k).setDisplaySize(sw, sw)
    this.glass.place(L.col.cx, h.baseY - 6 * L.u * h.k, h.unit)
    this.steam.setZone(this.glass.worldRadiusAt(1) * 1.2)
    this.kettleSteam.setZone(12 * L.u * h.k)
    // Bardak küçüldükçe demlikler de küçülür ve ortaya yaklaşır.
    const ps = 1.1 * Math.max(0.7, h.k)
    const spread = 0.6 + 0.4 * h.k
    const pw = L.potWidth.demlik * ps
    const dTex = this.demlik.texture.getSourceImage() as { width: number; height: number }
    this.demlik
      .setDisplaySize(pw, (pw * dTex.height) / dTex.width)
      .setPosition(L.col.cx + (L.pots.dem.rest.x - 20 * L.u - L.col.cx) * spread, h.baseY - 10 * L.u)
    const cw = L.potWidth.caydanlik * ps
    const cTex = this.caydanlik.texture.getSourceImage() as { width: number; height: number }
    this.caydanlik
      .setDisplaySize(cw, (cw * cTex.height) / cTex.width)
      .setPosition(L.col.cx + (L.pots.su.rest.x + 20 * L.u - L.col.cx) * spread, h.baseY - 10 * L.u)
    if (this.mode === 'preview') this.cameras.main.setScroll(0, this.previewScroll(L))
  }

  update(_t: number, deltaMs: number) {
    const dt = Math.min(0.1, deltaMs / 1000)
    this.glass.agitate(0.12)
    this.glass.update(dt)
    this.themeFx.update(dt)
    this.steam.setPosition(this.glass.container.x, this.glass.surfaceWorldY() - 6 * this.L.u)
    // Aynalanmış çaydanlığın ağzı solda.
    const c = this.caydanlik
    this.kettleSteam.setPosition(c.x - c.displayWidth * 0.46, c.y - c.displayHeight * 0.6)
  }

  /** Geliştirici çapa düzenleyicisi (yalnızca menü modunda, kamera kaymadan). */
  private setAnchorEditor(on: boolean): void {
    this.anchorEditor?.destroy()
    this.anchorEditor = null
    if (!on) return
    this.setMode('menu')
    this.cameras.main.setScroll(0, 0)
    this.anchorEditor = new AnchorEditor(this, [this.demlik, this.caydanlik], this.bg.image, this.L.u)
    this.anchorEditor.onClose = () => bus.emit('dev:anchors', false)
  }

  protected onResize(L: Layout): void {
    this.layoutAll(L)
    if (this.anchorEditor) this.setAnchorEditor(true)
  }

  protected onShutdown(): void {
    this.anchorEditor?.destroy()
    this.anchorEditor = null
    this.glass?.destroy()
    this.steam?.destroy()
    this.kettleSteam?.destroy()
    this.themeFx?.destroy()
  }
}
