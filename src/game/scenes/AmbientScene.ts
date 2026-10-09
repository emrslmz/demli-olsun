/** Menülerdeyken arkada dönen sakin kahvehane sahnesi. */

import type * as Phaser from 'phaser'
import type { Layout } from '../layout'
import { Background } from '../objects/Background'
import { runtime } from '../runtime'
import { BaseScene } from './BaseScene'

export class AmbientScene extends BaseScene {
  private bg!: Background
  private logo!: Phaser.GameObjects.Image

  constructor() {
    super('Ambient')
  }

  create() {
    this.setupBase()
    const L = this.L
    this.bg = new Background(this, runtime.venue, L)
    this.logo = this.add.image(0, 0, 'logo_emblem')
    this.layoutAll(L)
    this.tweens.add({ targets: this.logo, y: '-=12', duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  }

  private layoutAll(L: Layout) {
    this.bg.layout(L)
    const size = 360 * L.u
    this.logo.setPosition(L.col.cx, L.counterY - size * 0.6).setDisplaySize(size, size)
  }

  protected onResize(L: Layout): void {
    this.layoutAll(L)
  }
}
