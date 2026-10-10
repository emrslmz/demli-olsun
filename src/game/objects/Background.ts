/**
 * Mekan arka planı + tezgâh. Arka plan (duvar/manzara) ekran oranına en yakın varyanttan cover ölçeklenir,
 * tezgâh çizgisi layout'a hizalanır. Tezgâh iki katmandır: üst yüzey (arka kenardan bardağın önüne kadar)
 * ve ön panel (butonların arkası). Müşteri arka planla tezgâh arasında çizilir.
 */

import * as Phaser from 'phaser'
import { bgId, ensureTextures } from '../assets'
import type { Layout } from '../layout'

export const DEPTH = {
  bg: -100,
  customer: -60,
  counter: -40,
} as const

export class Background {
  readonly image: Phaser.GameObjects.Image
  readonly counterTop: Phaser.GameObjects.Image
  readonly counterFront: Phaser.GameObjects.Image
  private venue: string
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene, venue: string, L: Layout) {
    this.scene = scene
    this.venue = venue
    const key = bgId(venue, L.bg.variant)
    this.image = scene.add
      .image(0, 0, scene.textures.exists(key) ? key : '__DEFAULT')
      .setOrigin(0, 0)
      .setDepth(DEPTH.bg)
    this.counterTop = scene.add.image(0, 0, 'prop_tezgah_ust').setOrigin(0, 0).setDepth(DEPTH.counter)
    this.counterFront = scene.add
      .image(0, 0, 'prop_tezgah_on')
      .setOrigin(0, 0)
      .setDepth(DEPTH.counter + 1)
    this.layout(L)
  }

  setVenue(venue: string, L: Layout): void {
    this.venue = venue
    this.layout(L)
  }

  layout(L: Layout): void {
    const key = bgId(this.venue, L.bg.variant)
    const place = () => {
      if (!this.image.active) return
      if (this.scene.textures.exists(key)) this.image.setTexture(key)
      this.image.setPosition(L.bg.x, L.bg.y)
      this.image.setDisplaySize(L.bg.srcW * L.bg.scale, L.bg.srcH * L.bg.scale)
    }
    if (this.scene.textures.exists(key)) place()
    else void ensureTextures(this.scene, [key]).then(place)
    // Tezgâh üstü: görselin altındaki ~70 px'lik ön dudak counterFrontY'ye denk gelir.
    const tex = this.counterTop.texture.getSourceImage() as { width: number; height: number }
    const lipFrac = 70 / Math.max(1, tex.height)
    const topY = L.counterY - 6 * L.u
    const topH = (L.counterFrontY - topY) / (1 - lipFrac)
    this.counterTop.setPosition(0, topY).setDisplaySize(L.W, topH)
    this.counterFront.setPosition(0, topY + topH - 4 * L.u).setDisplaySize(L.W, Math.max(10, L.H - (topY + topH) + 4 * L.u))
  }

  setVisible(v: boolean): void {
    this.image.setVisible(v)
    this.counterTop.setVisible(v)
    this.counterFront.setVisible(v)
  }
}
