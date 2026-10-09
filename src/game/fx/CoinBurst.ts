/** Bahşiş paraları kavis çizerek HUD sayacına akar. Havuzlu. */

import type * as Phaser from 'phaser'

export class CoinBurst {
  private readonly scene: Phaser.Scene
  private readonly pool: Phaser.GameObjects.Image[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  private get(): Phaser.GameObjects.Image {
    let c = this.pool.find((x) => !x.active)
    if (!c) {
      c = this.scene.add.image(0, 0, 'icon_coin').setDepth(92)
      this.pool.push(c)
    }
    return c.setActive(true).setVisible(true).setAlpha(1)
  }

  burst(
    from: { x: number; y: number },
    to: { x: number; y: number },
    count: number,
    size: number,
    onCoin?: (i: number) => void,
    reduced = false,
  ): void {
    const n = Math.max(1, Math.min(reduced ? 4 : 10, count))
    for (let i = 0; i < n; i++) {
      const c = this.get().setDisplaySize(size, size).setPosition(from.x, from.y)
      const spreadX = (Math.random() - 0.5) * size * 4
      const peakY = Math.min(from.y, to.y) - size * (1.5 + Math.random() * 2)
      const midX = (from.x + to.x) / 2 + spreadX
      const state = { t: 0 }
      const sx = from.x + spreadX * 0.4
      const sy = from.y
      this.scene.tweens.add({
        targets: state,
        t: 1,
        delay: i * 55,
        duration: 620,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          const t = state.t
          const u = 1 - t
          c.x = u * u * sx + 2 * u * t * midX + t * t * to.x
          c.y = u * u * sy + 2 * u * t * peakY + t * t * to.y
          c.rotation = t * 6
        },
        onComplete: () => {
          c.setActive(false).setVisible(false)
          onCoin?.(i)
        },
      })
    }
  }

  destroy(): void {
    for (const c of this.pool) c.destroy()
  }
}
