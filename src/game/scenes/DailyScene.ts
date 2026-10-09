/** Daily sahnesi — iskelet (Faz 1). */

import type * as Phaser from 'phaser'
import { FONTS } from '@/config/theme'
import type { Layout } from '../layout'
import { Background } from '../objects/Background'
import { runtime } from '../runtime'
import { BaseScene } from './BaseScene'

export class DailyScene extends BaseScene {
  private bg!: Background
  private label!: Phaser.GameObjects.Text

  constructor() {
    super('Daily')
  }

  create() {
    this.setupBase()
    const L = this.L
    this.bg = new Background(this, runtime.venue, L)
    this.label = this.add
      .text(L.col.cx, L.H / 2, 'Daily sahnesi (yapım aşamasında)', {
        fontFamily: FONTS.chalk,
        fontSize: `${48 * L.u}px`,
        color: '#EDEDE4',
      })
      .setOrigin(0.5)
  }

  protected onResize(L: Layout): void {
    this.bg.layout(L)
    this.label.setPosition(L.col.cx, L.H / 2).setFontSize(48 * L.u)
  }
}
