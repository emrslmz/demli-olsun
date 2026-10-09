/** Bardaktan ve çaydanlıktan yükselen yumuşak buhar (fx_steam, toplamalı karışım). */

import * as Phaser from 'phaser'

export class Steam {
  readonly emitter: Phaser.GameObjects.Particles.ParticleEmitter
  private on = false

  constructor(scene: Phaser.Scene, u: number, opts: { rate?: number; strength?: number; depth?: number } = {}) {
    const rate = opts.rate ?? 1
    const k = opts.strength ?? 1
    const key = scene.textures.exists('fx_steam') ? 'fx_steam' : 'ca_glow'
    this.emitter = scene.add.particles(0, 0, key, {
      emitting: false,
      lifespan: { min: 1500, max: 2400 },
      speedY: { min: -70 * u * k, max: -36 * u * k },
      speedX: { min: -10 * u, max: 10 * u },
      accelerationX: { min: -12 * u, max: 12 * u },
      scale: { start: 0.25 * u * k, end: 0.85 * u * k },
      alpha: { start: 0.0, end: 0, onUpdate: (_p, _key, t) => Math.sin(t * Math.PI) * 0.32 },
      rotate: { min: -25, max: 25 },
      blendMode: Phaser.BlendModes.ADD,
      frequency: 190 / rate,
      quantity: 1,
    })
    this.emitter.setDepth(opts.depth ?? 24)
    this.emitter.addEmitZone({ type: 'random', source: this.zone })
  }

  private readonly zone = {
    w: 10,
    getRandomPoint: (p: Phaser.Types.Math.Vector2Like) => {
      p.x = (Math.random() - 0.5) * this.zone.w
      p.y = (Math.random() - 0.5) * 8
      return p
    },
  }

  setActive(on: boolean): void {
    if (on === this.on) return
    this.on = on
    if (on) this.emitter.start()
    else this.emitter.stop()
  }

  /** Yayılım genişliği (bardak ağzı). Tek bir kaynak nesnesi kullanılır; karede bellek ayırmaz. */
  setZone(width: number): void {
    this.zone.w = width
  }

  setPosition(x: number, y: number): void {
    this.emitter.setPosition(x, y)
  }

  destroy(): void {
    this.emitter.destroy()
  }
}
