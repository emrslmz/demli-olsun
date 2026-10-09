/** Mekan arka planı: ekran oranına en yakın varyant seçilir, cover ölçeklenir; tezgâh çizgisi layout'a hizalanır. */

import * as Phaser from 'phaser'
import { bgId, ensureTextures } from '../assets'
import type { Layout } from '../layout'

export class Background {
  readonly image: Phaser.GameObjects.Image
  private venue: string
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene, venue: string, L: Layout) {
    this.scene = scene
    this.venue = venue
    const key = bgId(venue, L.bg.variant)
    this.image = scene.add.image(0, 0, scene.textures.exists(key) ? key : '__DEFAULT').setOrigin(0, 0).setDepth(-100)
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
  }
}
