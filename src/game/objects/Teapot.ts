/**
 * Demlik / çaydanlık. Görselde ağız sağa bakar; sağdaki çaydanlık yatay aynalanır (pivot ve spout da).
 * Tezgâhta dinlenir; dökümde kalkıp bardağın üstüne gelir ve ~35° eğilir, durunca düzelir,
 * artık akış bitince tezgâhtaki yerine döner. Dokunma alanı Station'da (tezgâhtaki yerinde sabit).
 */

import * as Phaser from 'phaser'
import { ANIM } from '@/config/gameplay'
import { ThemeService } from '@/services/theme/ThemeService'
import type { Point } from '../layout'

export class Teapot {
  readonly image: Phaser.GameObjects.Image
  private readonly scene: Phaser.Scene
  readonly mirrored: boolean
  private pivot: [number, number] = [0.5, 0.8]
  private spout: [number, number] = [0.96, 0.36]
  private tiltTween: Phaser.Tweens.Tween | null = null
  private poseTween: Phaser.Tweens.Tween | null = null
  private rest = { x: 0, y: 0 }
  private pour = { x: 0, y: 0 }
  private tilt = 0
  /** 0: tezgâhta, 1: bardağın üstünde. */
  private pose = 0
  private baseScale = 1
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
   * rest: tezgâhta dinlenirken gövdenin alt ortası. spoutTarget: dökerken (eğik) ağız ucunun varacağı nokta.
   * width: görüntülenen genişlik (px).
   */
  layout(rest: Point, spoutTarget: Point, width: number): void {
    const tex = this.image.texture.getSourceImage() as { width: number; height: number }
    const aspect = tex.height / Math.max(1, tex.width)
    this.image.setDisplaySize(width, width * aspect)
    this.baseScale = this.image.scaleX
    const h = this.image.displayHeight
    this.rest = { x: rest.x, y: rest.y - (1 - this.pivot[1]) * h }
    const s = this.spoutLocal()
    const a = Phaser.Math.DegToRad(ANIM.potTilt) * this.tiltSign
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    this.pour = { x: spoutTarget.x - (s.x * cos - s.y * sin), y: spoutTarget.y - (s.x * sin + s.y * cos) }
    this.applyTransform()
  }

  private applyTransform(): void {
    const p = this.pose
    // Kalkarken hafif kavis (yukarı doğru tümsek) ve küçük büyüme (kameraya yaklaşır)
    const arc = Math.sin(p * Math.PI) * this.image.displayHeight * 0.18
    const x = this.rest.x + (this.pour.x - this.rest.x) * p
    const y = this.rest.y + (this.pour.y - this.rest.y) * p - arc
    this.image.setPosition(x, y)
    this.image.setRotation(this.tilt)
    this.image.setScale(this.baseScale * (1 + 0.06 * p))
  }

  setPouring(on: boolean, reducedMotion = false): void {
    if (this.pouring === on) return
    this.pouring = on
    const k = reducedMotion ? 0.5 : 1
    if (on) this.movePose(1, 150 * k)
    this.tiltTween?.stop()
    const state = { tilt: this.tilt }
    this.tiltTween = this.scene.tweens.add({
      targets: state,
      tilt: on ? Phaser.Math.DegToRad(ANIM.potTilt) * this.tiltSign : 0,
      duration: (on ? ANIM.potTiltIn : ANIM.potTiltOut) * 1000 * k,
      delay: on ? 60 * k : 0,
      ease: on ? 'Back.easeOut' : 'Sine.easeInOut',
      onUpdate: () => {
        this.tilt = state.tilt
        this.applyTransform()
      },
    })
  }

  /** Döküm bitti (artık akış dahil): tezgâhtaki yerine döner. */
  park(reducedMotion = false): void {
    if (this.pouring || this.pose === 0) return
    if (this.poseTween?.isPlaying() && this.poseTarget === 0) return
    this.movePose(0, reducedMotion ? 120 : 260)
  }

  private poseTarget = 0
  private movePose(target: number, duration: number): void {
    this.poseTarget = target
    this.poseTween?.stop()
    const state = { p: this.pose }
    this.poseTween = this.scene.tweens.add({
      targets: state,
      p: target,
      duration,
      ease: target > 0 ? 'Cubic.easeOut' : 'Cubic.easeInOut',
      onUpdate: () => {
        this.pose = state.p
        this.applyTransform()
      },
    })
  }

  /** Anında tezgâha (yeni bardak, sahne başı). */
  snapToRest(): void {
    this.poseTween?.stop()
    this.tiltTween?.stop()
    this.pouring = false
    this.pose = 0
    this.tilt = 0
    this.applyTransform()
  }

  update(_dt: number): void {}

  /** Tezgâhta dinlenirken kapladığı alan (dokunma alanı için; pot kalkmışken de değişmez). */
  restBounds(): { x: number; y: number; w: number; h: number } {
    const w = this.image.width * this.baseScale
    const h = this.image.height * this.baseScale
    return { x: this.rest.x - this.image.originX * w, y: this.rest.y - this.image.originY * h, w, h }
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

  get atRest(): boolean {
    return this.pose < 0.02
  }

  destroy(): void {
    this.tiltTween?.stop()
    this.poseTween?.stop()
    this.image.destroy()
  }
}
