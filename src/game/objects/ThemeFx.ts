/**
 * Temanın dekor katmanı ve partikül efekti: kış kar yağışı, yaz güneş parıltısı, Halloween yarasaları,
 * tezgâh kenarı dekoru. Default temada yalnızca hafif toz zerreleri.
 */

import * as Phaser from 'phaser'
import { ThemeService } from '@/services/theme/ThemeService'
import type { Layout } from '../layout'

export class ThemeFx {
  private readonly scene: Phaser.Scene
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null
  private counterDeco: Phaser.GameObjects.Image | null = null
  private readonly bats: Phaser.GameObjects.Image[] = []
  private batT = 0
  private L!: Layout
  private readonly low: boolean
  private kind: 'snow' | 'glint' | 'bats' | 'dust' | null = null

  constructor(scene: Phaser.Scene, L: Layout, low: boolean) {
    this.scene = scene
    this.low = low
    const extras = ThemeService.extras()
    if (extras.deco.includes('deco_counter') && scene.textures.exists('deco_counter')) {
      this.counterDeco = scene.add.image(0, 0, 'deco_counter').setDepth(9).setOrigin(0.5, 0.86)
    }
    const p = extras.particles[0]
    if (p === 'fx_snowflake' && scene.textures.exists(p)) this.kind = 'snow'
    else if (p === 'fx_sun_glint' && scene.textures.exists(p)) this.kind = 'glint'
    else if (p === 'fx_bat' && scene.textures.exists(p)) this.kind = 'bats'
    else this.kind = 'dust'
    this.layout(L)
  }

  layout(L: Layout): void {
    this.L = L
    const u = L.u
    if (this.counterDeco) {
      const s = 190 * u
      this.counterDeco.setDisplaySize(s, s).setPosition(L.col.x + 120 * u, L.counterY + 6 * u)
    }
    this.emitter?.destroy()
    this.emitter = null
    const density = this.low ? 0.5 : 1
    const W = L.W
    const H = L.H
    if (this.kind === 'snow') {
      this.emitter = this.scene.add.particles(0, 0, 'fx_snowflake', {
        x: { min: -40 * u, max: W + 40 * u },
        y: -40 * u,
        lifespan: { min: 7000, max: 11000 },
        speedY: { min: 50 * u, max: 120 * u },
        speedX: { min: -30 * u, max: 30 * u },
        scale: { min: 0.15 * u * 2, max: 0.38 * u * 2 },
        rotate: { min: 0, max: 360 },
        alpha: { start: 0.95, end: 0.6 },
        frequency: 260 / density,
        quantity: 1,
      })
      this.emitter.setDepth(100)
    } else if (this.kind === 'glint') {
      this.emitter = this.scene.add.particles(0, 0, 'fx_sun_glint', {
        x: { min: 0, max: W },
        y: { min: 0, max: H * 0.6 },
        lifespan: { min: 900, max: 1600 },
        scale: { start: 0, end: 0.9 * u * 2, ease: 'Sine.easeOut' },
        alpha: { start: 0.8, end: 0 },
        rotate: { min: 0, max: 90 },
        blendMode: Phaser.BlendModes.ADD,
        frequency: 700 / density,
        quantity: 1,
      })
      this.emitter.setDepth(100)
    } else if (this.kind === 'dust') {
      this.emitter = this.scene.add.particles(0, 0, 'ca_dot', {
        x: { min: 0, max: W * 0.6 },
        y: { min: H * 0.05, max: H * 0.6 },
        lifespan: { min: 4000, max: 7000 },
        speedX: { min: 4 * u, max: 18 * u },
        speedY: { min: -8 * u, max: 8 * u },
        scale: { min: 0.04 * u * 2, max: 0.09 * u * 2 },
        alpha: { start: 0, end: 0, steps: 0, onUpdate: (_p, _k, t) => Math.sin(t * Math.PI) * 0.35 },
        tint: 0xfff3c4,
        blendMode: Phaser.BlendModes.ADD,
        frequency: 500 / density,
      })
      this.emitter.setDepth(5)
    } else if (this.kind === 'bats') {
      const n = this.low ? 2 : 4
      while (this.bats.length < n) this.bats.push(this.scene.add.image(-100, -100, 'fx_bat').setDepth(100))
    }
  }

  update(dt: number): void {
    if (this.kind !== 'bats' || this.bats.length === 0) return
    this.batT += dt
    const L = this.L
    this.bats.forEach((b, i) => {
      // Her yarasa ekranı yavaşça boydan boya geçer, kanat çırpar.
      const period = 9 + i * 2.3
      const t = ((this.batT + i * 3.1) % period) / period
      const dir = i % 2 ? -1 : 1
      const x = dir > 0 ? -80 * L.u + t * (L.W + 160 * L.u) : L.W + 80 * L.u - t * (L.W + 160 * L.u)
      const y = L.H * (0.08 + 0.12 * i) + Math.sin(this.batT * 2 + i) * 30 * L.u
      const s = (90 + i * 10) * L.u
      b.setPosition(x, y)
        .setDisplaySize(s, s * (0.7 + 0.3 * Math.abs(Math.sin(this.batT * 12 + i))))
        .setFlipX(dir < 0)
    })
  }

  destroy(): void {
    this.emitter?.destroy()
    this.counterDeco?.destroy()
    for (const b of this.bats) b.destroy()
  }
}
