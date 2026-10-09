/** Geliştirici katmanı: FPS ve bardak verileri (hacim, dem %, dolu %, akış). */

import type * as Phaser from 'phaser'
import type { Station } from './Station'

export class DebugOverlay {
  private readonly text: Phaser.GameObjects.Text
  private acc = 0

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(8, 8, '', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#7CFC9A',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 8, y: 6 },
      })
      .setDepth(1000)
      .setScrollFactor(0)
      .setVisible(false)
  }

  setVisible(v: boolean): void {
    this.text.setVisible(v)
  }

  place(x: number, y: number, fontPx: number): void {
    this.text.setPosition(x, y).setFontSize(Math.round(fontPx))
  }

  update(dt: number, scene: Phaser.Scene, st: Station, extra = ''): void {
    if (!this.text.visible) return
    this.acc += dt
    if (this.acc < 0.1) return
    this.acc = 0
    const fps = scene.game.loop.actualFps.toFixed(0)
    this.text.setText(
      [
        `FPS ${fps}`,
        `hacim ${(st.volume * 100).toFixed(1)}%  dem ${st.demPct.toFixed(1)}%`,
        `dem ${(st.dem * 100).toFixed(1)}  su ${(st.su * 100).toFixed(1)}  şeker ${st.sugar}`,
        `akış dem ${(st.chDem.flow * 100).toFixed(1)}/s ${st.chDem.phase}`,
        `akış su  ${(st.chSu.flow * 100).toFixed(1)}/s ${st.chSu.phase}`,
        extra,
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  destroy(): void {
    this.text.destroy()
  }
}
