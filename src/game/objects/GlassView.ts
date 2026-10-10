/**
 * Bardak görünümü: arka cam → sıvı gövdesi (kırpılan, tint'li) → yüzey elipsi (dalgalı) → ön cam.
 * Düz cartoon dili: çay neredeyse opak düz renk, yüzeyi açık tonlu ve konturlu. Bardakta hedef çizgisi yok:
 * sipariş müşterinin balonundaki örnek bardak ve renk çubuğuyla okunur.
 * Bardak her zaman glassModel profilinden çizilir; görünen seviye hesaplanan hacimle birebir tutar.
 * Sıvı yüzeyi iki sinüs dalgasının toplamıdır; döküm sırasında genlik artar, sonra durulur.
 */

import * as Phaser from 'phaser'
import type { GlassProfileId } from '@/core/glassModel'
import { rgbToInt, teaColor, type TeaRgba } from '@/core/teaColor'
import type { GlassSkin } from '@/data/cosmetics'
import { ELLIPSE_K, ensureGlassTextures, type GlassGeometry } from '../art/glassArt'

const SURFACE_POINTS = 20
const SWIRL_DOTS = 6

/** Cartoon: açık çay bile dolgun görünsün (renk okunurluğu arka plandan bağımsız kalır). */
const liquidAlpha = (a: number): number => 0.45 + 0.55 * a

export class GlassView {
  readonly container: Phaser.GameObjects.Container
  private readonly scene: Phaser.Scene
  private back!: Phaser.GameObjects.Image
  private liquid!: Phaser.GameObjects.Image
  private surface!: Phaser.GameObjects.Graphics
  private front!: Phaser.GameObjects.Image
  private readonly swirl: Phaser.GameObjects.Image[] = []
  geo!: GlassGeometry
  type: GlassProfileId = 'ince'
  private skin!: GlassSkin

  /** Görünen hacim oranı (0..1+), görünen dem oranı (karışma ile gecikmeli). */
  private volume = 0
  private shownDem = 0
  private targetDem = 0
  private agitation = 0
  private swirlT = 1
  private swirlDur = 0.4
  private swirlColor = 0xffffff
  private time = 0
  private color: TeaRgba = teaColor(0)
  /** Yüzey dalgasına anlık itki (şeker küpü, damla). */
  private bump = 0

  constructor(scene: Phaser.Scene, type: GlassProfileId, skin: GlassSkin) {
    this.scene = scene
    this.container = scene.add.container(0, 0)
    this.build(type, skin)
  }

  private build(type: GlassProfileId, skin: GlassSkin) {
    this.container.removeAll(true)
    this.swirl.length = 0
    this.type = type
    this.skin = skin
    const keys = ensureGlassTextures(this.scene, type, skin)
    const g = keys.geometry
    this.geo = g
    const ox = g.cx / g.texW
    const oy = g.yBase / g.texH
    this.back = this.scene.add.image(0, 0, keys.back).setOrigin(ox, oy)
    this.liquid = this.scene.add.image(0, 0, keys.liquid).setOrigin(ox, oy)
    this.surface = this.scene.add.graphics()
    for (let i = 0; i < SWIRL_DOTS; i++) {
      this.swirl.push(this.scene.add.image(0, 0, 'ca_dot').setAlpha(0))
    }
    this.front = this.scene.add.image(0, 0, keys.front).setOrigin(ox, oy)
    this.container.add([this.back, this.liquid, ...this.swirl, this.surface, this.front])
    this.applyLevel()
  }

  setType(type: GlassProfileId, skin: GlassSkin = this.skin): void {
    if (type === this.type && skin.id === this.skin.id) return
    this.build(type, skin)
  }

  /** unit: bardağın ekrandaki iç yüksekliği (px; kodla çizilen ya da kullanıcı görseli fark etmez). */
  place(x: number, baseY: number, unit: number): void {
    this.container.setPosition(x, baseY)
    this.container.setScale(unit / this.geo.hpx)
  }

  get displayScale(): number {
    return this.container.scaleX
  }

  /** Bardağın iç yüksekliği h'deki ekran y'si. */
  worldYAt(h: number): number {
    return this.container.y + (this.geo.y(h) - this.geo.yBase) * this.displayScale
  }

  worldRadiusAt(h: number): number {
    return this.geo.r(h) * this.displayScale
  }

  /** Sıvı yüzeyinin ekran y'si (boşsa iç dip). */
  surfaceWorldY(): number {
    return this.worldYAt(this.levelH())
  }

  levelH(): number {
    return this.geo.model.heightAt(Math.min(1, this.volume))
  }

  get topWorldY(): number {
    return this.worldYAt(1) - this.geo.r(1) * ELLIPSE_K * this.displayScale
  }

  /** Hacim ve dem oranını ayarlar. Dem oranı değiştiyse karışma girdabı oynar. */
  setContents(volume: number, dem: number, incoming: 'dem' | 'su' | null): void {
    this.volume = volume
    if (Math.abs(dem - this.targetDem) > 0.002 && incoming) {
      if (this.swirlT >= 0.6) {
        this.swirlT = 0
        this.swirlDur = 0.3 + Math.random() * 0.2
      }
      this.swirlColor = incoming === 'dem' ? rgbToInt(teaColor(1)) : 0xf4fbff
    }
    this.targetDem = dem
    if (volume <= 0.0005) {
      this.shownDem = dem
    }
  }

  /** Kaşıkla karıştırma: yüzeyin altında dönen açık renkli girdap (eriyen şeker). */
  stirSwirl(duration: number, color = 0xfff6e6): void {
    this.swirlT = 0
    this.swirlDur = Math.max(0.2, duration)
    this.swirlColor = color
  }

  agitate(amount: number): void {
    this.agitation = Math.min(1.5, Math.max(this.agitation, amount))
  }

  kick(amount: number): void {
    this.bump = Math.min(2, this.bump + amount)
  }

  /** Tamamen boşalt (yeni bardak). */
  reset(): void {
    this.volume = 0
    this.shownDem = 0
    this.targetDem = 0
    this.agitation = 0
    this.bump = 0
    this.swirlT = 1
    this.applyLevel()
  }

  update(dt: number): void {
    this.time += dt
    // Karışma: görünen renk hedefe 0.3–0.5 sn'de yaklaşır.
    const k = 1 - Math.exp(-dt / Math.max(0.05, this.swirlDur * 0.35))
    this.shownDem += (this.targetDem - this.shownDem) * k
    this.agitation *= Math.exp(-dt * 1.6)
    this.bump *= Math.exp(-dt * 4)
    this.swirlT = Math.min(1, this.swirlT + dt / this.swirlDur)
    this.applyLevel()
  }

  private applyLevel(): void {
    const g = this.geo
    const vol = Math.min(1, this.volume)
    const h = g.model.heightAt(vol)
    this.color = teaColor(this.shownDem, g.model.def.pathFactor)
    const tint = rgbToInt(this.color)
    const empty = vol <= 0.0008
    // Sıvı gövdesi: seviyeden aşağısı.
    const cropY = g.y(h)
    this.liquid.setVisible(!empty)
    this.liquid.setCrop(0, cropY, g.texW, g.texH - cropY)
    this.liquid.setTint(tint)
    this.liquid.setAlpha(liquidAlpha(this.color.a))
    this.drawSurface(h, empty)
    this.drawSwirl(h, empty)
  }

  private drawSurface(h: number, empty: boolean): void {
    const s = this.surface
    s.clear()
    if (empty) return
    const g = this.geo
    const cy = g.y(h) - g.yBase
    const rx = g.r(h) * 0.995
    const ry = rx * ELLIPSE_K
    const amp = ry * (0.04 + 0.22 * this.agitation + 0.25 * this.bump)
    const t = this.time
    const c = this.color
    // Yüzey: gövdeden belirgin açık (turuncuya kayan) düz ton + koyu ince kontur + solda beyaz parıltı.
    const lift = (v: number, to: number) => Math.round(v + (to - v) * 0.45)
    const top = rgbToInt({ r: lift(c.r, 255), g: lift(c.g, 180), b: lift(c.b, 92) })
    const alpha = Math.min(1, liquidAlpha(c.a) + 0.08)
    const path = () => {
      s.beginPath()
      for (let i = 0; i <= SURFACE_POINTS; i++) {
        const a = (i / SURFACE_POINTS) * Math.PI * 2
        const wave = Math.sin(a * 3 + t * 7.5) * 0.6 + Math.sin(a * 5 - t * 11) * 0.4
        const x = Math.cos(a) * rx
        const y = cy + Math.sin(a) * ry + wave * amp
        if (i === 0) s.moveTo(x, y)
        else s.lineTo(x, y)
      }
      s.closePath()
    }
    s.fillStyle(top, alpha)
    path()
    s.fillPath()
    const edge = rgbToInt({ r: Math.round(c.r * 0.55), g: Math.round(c.g * 0.5), b: Math.round(c.b * 0.45) })
    s.lineStyle(Math.max(1.5, g.hpx * 0.012), edge, alpha)
    path()
    s.strokePath()
    // Parıltı
    s.fillStyle(0xffffff, 0.5 + 0.2 * this.agitation)
    s.fillEllipse(-rx * 0.38, cy - ry * 0.1, rx * 0.52, ry * 0.68)
  }

  private drawSwirl(h: number, empty: boolean): void {
    const active = !empty && this.swirlT < 1
    const g = this.geo
    for (let i = 0; i < this.swirl.length; i++) {
      const d = this.swirl[i] as Phaser.GameObjects.Image
      if (!active) {
        d.setAlpha(0)
        continue
      }
      const p = this.swirlT
      const hh = h * (0.25 + 0.55 * ((i * 0.37) % 1))
      const r = g.r(hh) * (0.25 + 0.5 * (1 - p))
      const ang = this.time * 9 + (i / this.swirl.length) * Math.PI * 2
      d.setPosition(Math.cos(ang) * r, g.y(hh) - g.yBase + Math.sin(ang) * r * ELLIPSE_K * 2)
      const size = g.r(hh) * (0.55 + 0.3 * Math.sin(p * Math.PI))
      d.setDisplaySize(size, size * 0.45)
      d.setRotation(ang * 0.3)
      d.setTint(this.swirlColor)
      d.setAlpha(0.32 * Math.sin(p * Math.PI))
    }
  }

  setVisible(v: boolean): void {
    this.container.setVisible(v)
  }

  destroy(): void {
    this.container.destroy(true)
  }
}
