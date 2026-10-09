/**
 * Demlik / çaydanlık. Görselde ağız sağa bakar; sağdaki çaydanlık yatay aynalanır (pivot ve spout da).
 * Basılınca ~35° eğilir (pivot etrafında), bırakınca ease ile geri döner.
 */

import * as Phaser from 'phaser'
import { ANIM } from '@/config/gameplay'
import { ThemeService } from '@/services/theme/ThemeService'

export class Teapot {
  readonly image: Phaser.GameObjects.Image
  private readonly scene: Phaser.Scene
  readonly mirrored: boolean
  private pivot: [number, number] = [0.5, 0.8]
  private spout: [number, number] = [0.96, 0.36]
  private tween: Phaser.Tweens.Tween | null = null
  private restX = 0
  private restY = 0
  private tilt = 0
  private lean = 0
  private idleT = Math.random() * 10
  pouring = false

  constructor(scene: Phaser.Scene, key: string, mirrored: boolean) {
    this.scene = scene
    this.mirrored = mirrored
    this.image = scene.add.image(0, 0, key)
    this.setTexture(key)
  }

  setTexture(key: string): void {
    if (!this.scene.textures.exists(key)) return
    this.image.setTexture(key)
    const meta = ThemeService.meta(key)
    this.pivot = meta?.pivot ?? [0.5, 0.8]
    this.spout = meta?.spout ?? [0.96, 0.36]
    this.image.setFlipX(this.mirrored)
    this.image.setOrigin(this.mirrored ? 1 - this.pivot[0] : this.pivot[0], this.pivot[1])
  }

  get anchors(): { pivot: [number, number]; spout: [number, number] } {
    return { pivot: [...this.pivot], spout: [...this.spout] }
  }

  setAnchors(pivot: [number, number], spout: [number, number]): void {
    this.pivot = pivot
    this.spout = spout
    this.image.setOrigin(this.mirrored ? 1 - pivot[0] : pivot[0], pivot[1])
  }

  /** Eğilme yönü: soldaki demlik saat yönünde (+), aynalanan çaydanlık ters yönde (−). */
  private get tiltSign(): number {
    return this.mirrored ? -1 : 1
  }

  /** Pivot'tan ağız ucuna yerel vektör (ekran px, dönmeden önce). */
  private spoutLocal(): { x: number; y: number } {
    const w = this.image.displayWidth
    const h = this.image.displayHeight
    const sx = (this.spout[0] - this.pivot[0]) * w * (this.mirrored ? -1 : 1)
    const sy = (this.spout[1] - this.pivot[1]) * h
    return { x: sx, y: sy }
  }

  /**
   * Eğildiğinde ağız ucu `target`a gelecek şekilde yerleştirir.
   * width: görüntülenen genişlik (px).
   */
  layout(target: { x: number; y: number }, width: number): void {
    const tex = this.image.texture.getSourceImage() as { width: number; height: number }
    const aspect = tex.height / Math.max(1, tex.width)
    this.image.setDisplaySize(width, width * aspect)
    const s = this.spoutLocal()
    const a = Phaser.Math.DegToRad(ANIM.potTilt) * this.tiltSign
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const rx = s.x * cos - s.y * sin
    const ry = s.x * sin + s.y * cos
    this.restX = target.x - rx
    this.restY = target.y - ry
    this.applyTransform()
  }

  private applyTransform(): void {
    const leanX = this.lean * this.tiltSign * this.image.displayWidth * 0.04
    const bob = this.pouring ? 0 : Math.sin(this.idleT * 1.4) * this.image.displayHeight * 0.006
    this.image.setPosition(this.restX + leanX, this.restY + bob - this.lean * this.image.displayHeight * 0.02)
    this.image.setRotation(this.tilt)
  }

  setPouring(on: boolean, reducedMotion = false): void {
    if (this.pouring === on) return
    this.pouring = on
    this.tween?.stop()
    const target = on ? Phaser.Math.DegToRad(ANIM.potTilt) * this.tiltSign : 0
    const state = { tilt: this.tilt, lean: this.lean }
    this.tween = this.scene.tweens.add({
      targets: state,
      tilt: target,
      lean: on ? 1 : 0,
      duration: (on ? ANIM.potTiltIn : ANIM.potTiltOut) * 1000 * (reducedMotion ? 0.5 : 1),
      ease: on ? 'Back.easeOut' : 'Sine.easeInOut',
      onUpdate: () => {
        this.tilt = state.tilt
        this.lean = state.lean
        this.applyTransform()
      },
    })
  }

  update(dt: number): void {
    this.idleT += dt
    if (!this.pouring && !this.tween?.isPlaying()) this.applyTransform()
  }

  /** Ağız ucunun şu anki dünya konumu. */
  spoutWorld(out: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    const s = this.spoutLocal()
    const cos = Math.cos(this.tilt)
    const sin = Math.sin(this.tilt)
    out.set(this.image.x + s.x * cos - s.y * sin, this.image.y + s.x * sin + s.y * cos)
    return out
  }

  /** Akışın çıkış yönü (birim vektör): ağız yönü + eğim. */
  spoutDir(out: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    const base = this.mirrored ? Math.PI : 0
    const a = base + this.tilt + this.tiltSign * 0.35
    out.set(Math.cos(a), Math.sin(a))
    return out
  }

  /** Eğim oranı 0..1 (akış görünürlüğü için). */
  get tiltRatio(): number {
    return Math.abs(this.tilt) / Phaser.Math.DegToRad(ANIM.potTilt)
  }

  destroy(): void {
    this.tween?.stop()
    this.image.destroy()
  }
}
