/**
 * Geliştirici çapa düzenleyicisi: demlik/çaydanlığın `pivot` ve `spout` noktalarını, arka planın `counterY`
 * çizgisini ekranda sürükle; sonucu manifest biçiminde JSON olarak panoya kopyala.
 * Koordinatlar görselin kendi (aynalanmamış) boyutuna göre 0..1'dir.
 */

import * as Phaser from 'phaser'
import { FONTS } from '@/config/theme'
import { ThemeService } from '@/services/theme/ThemeService'

interface PotTarget {
  image: Phaser.GameObjects.Image
  pivot: Phaser.GameObjects.Arc
  spout: Phaser.GameObjects.Arc
}

const r3 = (v: number): number => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000

export class AnchorEditor {
  private readonly scene: Phaser.Scene
  private readonly pots: PotTarget[] = []
  private readonly bg: Phaser.GameObjects.Image
  private readonly counterLine: Phaser.GameObjects.Rectangle
  private readonly counterHandle: Phaser.GameObjects.Arc
  private readonly panel: Phaser.GameObjects.Text
  private readonly copyBtn: Phaser.GameObjects.Text
  private readonly closeBtn: Phaser.GameObjects.Text
  private readonly objects: Phaser.GameObjects.GameObject[] = []
  onClose: (() => void) | null = null

  constructor(scene: Phaser.Scene, pots: Phaser.GameObjects.Image[], bg: Phaser.GameObjects.Image, u: number) {
    this.scene = scene
    this.bg = bg
    const r = Math.max(14, 22 * u)
    for (const image of pots) {
      const meta = ThemeService.meta(image.texture.key)
      const pivot = this.handle(0x2f80ed, r)
      const spout = this.handle(0xeb5757, r)
      const t: PotTarget = { image, pivot, spout }
      this.place(pivot, image, meta?.pivot ?? [0.5, 0.85])
      this.place(spout, image, meta?.spout ?? [0.95, 0.35])
      this.pots.push(t)
    }
    const b = bg.getBounds()
    const cy = b.y + b.height * (ThemeService.meta(bg.texture.key)?.counterY ?? 0.68)
    this.counterLine = scene.add.rectangle(b.centerX, cy, b.width, Math.max(2, 4 * u), 0x27ae60).setDepth(500)
    this.counterHandle = this.handle(0x27ae60, r)
    this.counterHandle.setPosition(scene.scale.width - r * 2.2, cy)
    this.objects.push(this.counterLine)

    const style = { fontFamily: FONTS.ui, fontStyle: '800', fontSize: `${Math.round(22 * u)}px`, color: '#FFFFFF' }
    this.panel = scene.add
      .text(16 * u, 16 * u, '', {
        ...style,
        backgroundColor: 'rgba(0,0,0,0.72)',
        padding: { x: 12 * u, y: 10 * u },
        wordWrap: { width: scene.scale.width - 64 * u },
      })
      .setDepth(510)
      .setScrollFactor(0)
    this.copyBtn = this.button('Kopyala', 0x27ae60, style, () => void this.copy())
    this.closeBtn = this.button('Kapat', 0x8b1e0f, style, () => this.onClose?.())
    const bw = this.copyBtn.width
    this.copyBtn.setPosition(scene.scale.width - bw - this.closeBtn.width - 40 * u, scene.scale.height - 120 * u)
    this.closeBtn.setPosition(scene.scale.width - this.closeBtn.width - 20 * u, scene.scale.height - 120 * u)
    this.objects.push(this.panel, this.copyBtn, this.closeBtn)

    scene.input.on(Phaser.Input.Events.DRAG, this.onDrag, this)
    this.refresh()
  }

  private handle(color: number, r: number): Phaser.GameObjects.Arc {
    const h = this.scene.add.circle(0, 0, r, color, 0.55).setStrokeStyle(3, 0xffffff).setDepth(505)
    h.setInteractive({ draggable: true, useHandCursor: true })
    this.objects.push(h)
    return h
  }

  private button(label: string, color: number, style: Phaser.Types.GameObjects.Text.TextStyle, fn: () => void): Phaser.GameObjects.Text {
    const t = this.scene.add
      .text(0, 0, label, { ...style, backgroundColor: `#${color.toString(16).padStart(6, '0')}`, padding: { x: 18, y: 12 } })
      .setDepth(510)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
    t.on(Phaser.Input.Events.POINTER_DOWN, fn)
    return t
  }

  /** Görselin 0..1 koordinatını dünya konumuna çevirir (aynalama dahil). */
  private place(h: Phaser.GameObjects.Arc, image: Phaser.GameObjects.Image, n: [number, number]): void {
    const b = image.getBounds()
    const nx = image.flipX ? 1 - n[0] : n[0]
    h.setPosition(b.x + b.width * nx, b.y + b.height * n[1])
  }

  private norm(h: Phaser.GameObjects.Arc, image: Phaser.GameObjects.Image): [number, number] {
    const b = image.getBounds()
    const nx = (h.x - b.x) / b.width
    return [r3(image.flipX ? 1 - nx : nx), r3((h.y - b.y) / b.height)]
  }

  private onDrag(_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject, x: number, y: number): void {
    if (obj === this.counterHandle) {
      this.counterHandle.setY(y)
      this.counterLine.setY(y)
    } else if (this.objects.includes(obj)) {
      ;(obj as Phaser.GameObjects.Arc).setPosition(x, y)
    }
    this.refresh()
  }

  private result(): Record<string, Record<string, unknown>> {
    const out: Record<string, Record<string, unknown>> = {}
    for (const t of this.pots) out[t.image.texture.key] = { pivot: this.norm(t.pivot, t.image), spout: this.norm(t.spout, t.image) }
    const b = this.bg.getBounds()
    out[this.bg.texture.key] = { counterY: r3((this.counterLine.y - b.y) / b.height) }
    return out
  }

  private refresh(): void {
    const lines = Object.entries(this.result()).map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    this.panel.setText(['Çapa düzenleyici — mavi: pivot · kırmızı: spout · yeşil: counterY', ...lines])
  }

  private async copy(): Promise<void> {
    const json = JSON.stringify(this.result(), null, 2)
    try {
      await navigator.clipboard.writeText(json)
      this.copyBtn.setText('Kopyalandı ✓')
    } catch {
      console.info('[anchors]\n' + json)
      this.copyBtn.setText('Konsola yazıldı')
    }
    this.scene.time.delayedCall(1500, () => this.copyBtn.active && this.copyBtn.setText('Kopyala'))
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.DRAG, this.onDrag, this)
    for (const o of this.objects) o.destroy()
    this.objects.length = 0
  }
}
