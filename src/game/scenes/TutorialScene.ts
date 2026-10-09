/** Tutorial sahnesi — iskelet (Faz 1). */

import type * as Phaser from 'phaser'
import { bus } from '@/bus'
import { FONTS } from '@/config/theme'
import type { Layout } from '../layout'
import { Background } from '../objects/Background'
import { runtime } from '../runtime'
import { BaseScene } from './BaseScene'

export class TutorialScene extends BaseScene {
  private bg!: Background
  private label!: Phaser.GameObjects.Text

  constructor() {
    super('Tutorial')
  }

  create() {
    this.setupBase()
    const L = this.L
    this.bg = new Background(this, runtime.venue, L)
    this.label = this.add
      .text(L.col.cx, L.H / 2, 'Tutorial sahnesi (yapım aşamasında)', {
        fontFamily: FONTS.chalk,
        fontSize: `${48 * L.u}px`,
        color: '#EDEDE4',
      })
      .setOrigin(0.5)
    this.time.delayedCall(1500, () => {
      if ('Tutorial' === 'Tutorial') bus.emit('tutorial:finished', { skipped: true })
    })
  }

  protected onResize(L: Layout): void {
    this.bg.layout(L)
    this.label.setPosition(L.col.cx, L.H / 2).setFontSize(48 * L.u)
  }
}
