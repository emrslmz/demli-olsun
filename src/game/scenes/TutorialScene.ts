/**
 * Eğitim: el işaretiyle yönlendirilen 3 sipariş — "basılı tut", "erken bırak, damlalar devam eder", "servis et".
 * Atlanabilir; Ayarlar'dan tekrar oynanabilir.
 */

import * as Phaser from 'phaser'
import { bus } from '@/bus'
import { FONTS } from '@/config/theme'
import type { Order } from '@/core/orders'
import { evaluateServe, round1 } from '@/core/scoring'
import { bucketFor } from '@/data/lines'
import { pct1, tr } from '@/i18n/tr'
import { AudioService } from '@/services/audio/AudioService'
import type { Layout } from '../layout'
import { PlayScene } from './PlayScene'

type Sub = 'dem' | 'su' | 'serve' | 'early-dem' | 'early-su' | 'early-wait' | 'serve2' | 'free' | 'done' | 'busy'

const ORDERS: Order[] = [
  {
    id: 1,
    customer: 'riza',
    teaType: 'tavsan',
    demTarget: 35,
    fillType: 'normal',
    fillTarget: 80,
    sugar: 0,
    patience: 999,
  },
  {
    id: 2,
    customer: 'ogrenci',
    teaType: 'acik',
    demTarget: 20,
    fillType: 'normal',
    fillTarget: 85,
    sugar: 0,
    patience: 999,
  },
  {
    id: 3,
    customer: 'muhtar',
    teaType: 'demli',
    demTarget: 50,
    fillType: 'normal',
    fillTarget: 85,
    sugar: 0,
    patience: 999,
  },
]

export class TutorialScene extends PlayScene {
  private step = 0
  private sub: Sub = 'busy'
  private hasCustomer = false
  private hand!: Phaser.GameObjects.Image
  private handTween: Phaser.Tweens.Tween | null = null
  private hintBg!: Phaser.GameObjects.Graphics
  private hintText!: Phaser.GameObjects.Text
  private skip!: Phaser.GameObjects.Container
  private releaseFill = 0
  private finished = false

  constructor() {
    super('Tutorial')
  }

  create() {
    this.step = 0
    this.sub = 'busy'
    this.hasCustomer = false
    this.finished = false
    this.createPlay({ glass: 'ince', gauge: 'numbers' })
    this.hand = this.add.image(0, 0, 'ca_hand').setDepth(150).setOrigin(0.5, 0.05).setVisible(false)
    this.hintBg = this.add.graphics().setDepth(140)
    this.hintText = this.add
      .text(0, 0, '', { fontFamily: FONTS.ui, fontStyle: '700', fontSize: '34px', color: '#3B2416', align: 'center' })
      .setOrigin(0.5)
      .setDepth(141)
    const skipText = this.add
      .text(0, 0, `${tr.tutorial.skip} ›`, { fontFamily: FONTS.ui, fontStyle: '900', fontSize: '26px', color: '#FFF6E6' })
      .setOrigin(0.5)
    const skipBg = this.add.graphics()
    this.skip = this.add.container(0, 0, [skipBg, skipText]).setDepth(160)
    this.skip.setData('bg', skipBg).setData('text', skipText)
    const zone = this.add.zone(0, 0, 10, 10).setInteractive().setDepth(161)
    zone.on(Phaser.Input.Events.POINTER_DOWN, () => this.finish(true))
    this.skip.setData('zone', zone)
    this.station.setHasOrder(false)
    this.station.events.on('serve', () => void this.onServe())
    this.station.events.on('overflow', () => void this.onOverflow())
    this.station.events.on('pourEnd', (src: string) => {
      if (this.sub === 'early-su' && src === 'su') {
        this.releaseFill = this.station.fillPct
        this.sub = 'early-wait'
        this.hideHand()
      }
    })
    this.onResize(this.L)
    void this.startStep(0)
  }

  private async startStep(i: number): Promise<void> {
    const g = this.gen
    this.step = i
    const order = ORDERS[i] as Order
    this.station.setTargets(order.demTarget, order.fillTarget)
    await this.customer.enter(order)
    if (!this.alive(g)) return
    this.hasCustomer = true
    this.station.setHasOrder(true)
    this.station.setInputEnabled(true)
    if (i === 0) this.setSub('dem')
    else if (i === 1) this.setSub('early-dem')
    else this.setSub('free')
  }

  private setSub(s: Sub): void {
    this.sub = s
    const L = this.L
    const c = L.controls
    switch (s) {
      case 'dem':
        this.hint(tr.tutorial.step1a)
        this.pointAt(c.dem.x + c.dem.w / 2, c.dem.y + c.dem.h * 0.55)
        break
      case 'su':
        this.hint(tr.tutorial.step1b)
        this.pointAt(c.su.x + c.su.w / 2, c.su.y + c.su.h * 0.55)
        break
      case 'serve':
        this.hint(tr.tutorial.step1c)
        this.pointAt(c.serve.x + c.serve.w / 2, c.serve.y + c.serve.h * 0.55)
        break
      case 'early-dem':
        this.hint(tr.tutorial.step2a)
        this.pointAt(c.dem.x + c.dem.w / 2, c.dem.y + c.dem.h * 0.55)
        break
      case 'early-su':
        this.pointAt(c.su.x + c.su.w / 2, c.su.y + c.su.h * 0.55)
        break
      case 'serve2':
        this.hint(tr.tutorial.step2b)
        this.pointAt(c.serve.x + c.serve.w / 2, c.serve.y + c.serve.h * 0.55)
        break
      case 'free':
        this.hint(tr.tutorial.step3)
        this.hideHand()
        break
      case 'done':
        this.hint(tr.tutorial.done)
        this.hideHand()
        break
      default:
        break
    }
  }

  protected tick(_dt: number): void {
    const st = this.station
    const idle = st.chDem.phase === 'idle' && st.chSu.phase === 'idle'
    const o = ORDERS[this.step] as Order
    // Hedef dem hacminin %60'ı dökülünce suya geç (oyuncu kendiliğinden suya basarsa da).
    const demGoal = (o.demTarget / 100) * (o.fillTarget / 100) * 0.6
    const su = st.volume - st.dem
    if (this.sub === 'dem' && ((st.dem >= demGoal && idle) || su > 0.03)) this.setSub('su')
    else if (this.sub === 'su' && st.volume >= (o.fillTarget / 100) * 0.85 && idle) this.setSub('serve')
    else if (this.sub === 'early-dem' && ((st.dem >= demGoal && idle) || su > 0.03)) this.setSub('early-su')
    else if (this.sub === 'early-wait' && idle) {
      const extra = st.fillPct - this.releaseFill
      if (extra > 0.2) {
        this.floats.float(
          this.L.col.cx,
          st.glass.topWorldY - 30 * this.L.u,
          `Artık akış: +%${pct1(extra)}`,
          40 * this.L.u,
          '#9FE3B0',
          60 * this.L.u,
          1800,
        )
      }
      this.setSub('serve2')
    }
  }

  private async onServe(): Promise<void> {
    if (this.sub === 'busy' || this.sub === 'done' || !this.hasCustomer) return
    const g = this.gen
    const order = ORDERS[this.step] as Order
    const st = this.station
    this.sub = 'busy'
    this.hideHand()
    st.setInputEnabled(false)
    st.setBusy(true)
    const ev = evaluateServe({
      demPct: st.demPct,
      fillPct: st.fillPct,
      targetDem: order.demTarget,
      targetFill: order.fillTarget,
      sugarGiven: st.sugar,
      sugarTarget: order.sugar,
    })
    await st.stir(this.reduced)
    if (!this.alive(g)) return
    this.customer.setExpression(ev.accepted ? (ev.stars >= 2 ? 'happy' : 'neutral') : 'angry')
    this.say(order.customer, bucketFor(ev.accuracy, ev.accepted))
    const L = this.L
    const top = st.glass.topWorldY
    this.floats.float(L.col.cx, top - 40 * L.u, `%${pct1(round1(ev.accuracy))}`, 56 * L.u)
    this.starsPop.show(L.col.cx, top - 120 * L.u, ev.stars, 70 * L.u, (i) => AudioService.play('star', { rate: 1 + i * 0.12, volume: 0.6 }))
    AudioService.play(ev.accepted ? 'serve' : 'reject')
    await this.wait(1100)
    if (!this.alive(g)) return
    if (ev.accepted) await st.serveTo(this.customer.servePoint())
    else await st.slideOut()
    if (!this.alive(g)) return
    void this.customer.leave(ev.accepted)
    this.hasCustomer = false
    st.resetContents()
    st.setHasOrder(false)
    await st.slideIn()
    if (!this.alive(g)) return
    st.setBusy(false)
    if (this.step < ORDERS.length - 1) {
      void this.startStep(this.step + 1)
    } else {
      this.setSub('done')
      await this.wait(1800)
      if (!this.alive(g)) return
      this.finish(false)
    }
  }

  private async onOverflow(): Promise<void> {
    const g = this.gen
    this.sub = 'busy'
    this.station.spill()
    AudioService.play('overflow')
    this.floats.burst(this.L.col.cx, this.station.glass.topWorldY - 80 * this.L.u, 'Taştı! Bir daha dene.', 46 * this.L.u, '#FF8A7A')
    await this.wait(1100)
    if (!this.alive(g)) return
    await this.station.slideOut()
    if (!this.alive(g)) return
    this.station.resetContents()
    await this.station.slideIn()
    if (!this.alive(g)) return
    this.station.setBusy(false)
    this.station.setInputEnabled(true)
    // Adımı baştan al.
    const restart: Sub = this.step === 0 ? 'dem' : this.step === 1 ? 'early-dem' : 'free'
    this.setSub(restart)
  }

  private finish(skipped: boolean): void {
    if (this.finished) return
    this.finished = true
    this.hideHand()
    this.station.setInputEnabled(false)
    bus.emit('tutorial:finished', { skipped })
  }

  protected inputAllowed(): boolean {
    return this.sub !== 'busy' && this.sub !== 'done' && !this.finished
  }

  // ---------- Görseller ----------

  private hint(text: string): void {
    const L = this.L
    const u = L.u
    this.hintText
      .setText(text)
      .setFontSize(Math.round(36 * u))
      .setWordWrapWidth(L.col.w * 0.8)
    const w = Math.min(L.col.w * 0.9, this.hintText.width + 60 * u)
    const h = this.hintText.height + 36 * u
    const x = L.col.cx
    const y = Math.max(L.counterFrontY + h / 2 + 6 * u, (L.counterFrontY + L.controls.area.y) / 2)
    const g = this.hintBg
    g.clear()
    // Krem cartoon kart: kalın koyu kenar, altta gölge, üstte parlama.
    const o = 5 * u
    g.fillStyle(0x2a1408, 0.85).fillRoundedRect(x - w / 2 - o, y - h / 2 - o + 8 * u, w + o * 2, h + o * 2, 24 * u)
    g.fillStyle(0x3b2416, 1).fillRoundedRect(x - w / 2 - o, y - h / 2 - o, w + o * 2, h + o * 2, 24 * u)
    g.fillStyle(0xfff3dc, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 20 * u)
    g.fillStyle(0xffffff, 0.85).fillRoundedRect(x - w / 2 + 16 * u, y - h / 2 + 7 * u, w * 0.45, 8 * u, 4 * u)
    this.hintText.setPosition(x, y)
    this.hintText.setAlpha(0)
    this.tweens.add({ targets: this.hintText, alpha: 1, duration: 250 })
    AudioService.play('pop')
  }

  private pointAt(x: number, y: number): void {
    const s = 130 * this.L.u
    this.hand
      .setVisible(true)
      .setDisplaySize(s, s * (168 / 128))
      .setPosition(x + s * 0.15, y)
      .setAlpha(1)
    this.handTween?.stop()
    if (this.reduced) return
    this.handTween = this.tweens.add({
      targets: this.hand,
      y: y - 26 * this.L.u,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private hideHand(): void {
    this.handTween?.stop()
    this.handTween = null
    this.hand.setVisible(false)
  }

  protected onResize(L: Layout): void {
    this.layoutPlay(L)
    const u = L.u
    const bg = this.skip.getData('bg') as Phaser.GameObjects.Graphics
    const text = this.skip.getData('text') as Phaser.GameObjects.Text
    const zone = this.skip.getData('zone') as Phaser.GameObjects.Zone
    text.setFontSize(Math.round(28 * u))
    const w = text.width + 40 * u
    const h = 64 * u
    bg.clear()
    bg.fillStyle(0x3b2416, 0.92).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    const x = L.col.x + L.col.w - w / 2 - 16 * u
    const y = L.hud.y + L.hud.h / 2
    this.skip.setPosition(x, y)
    zone.setPosition(x, y).setSize(w + 20 * u, h + 20 * u)
    zone.input?.hitArea.setTo(0, 0, w + 20 * u, h + 20 * u)
    if (this.hintText?.text) this.hint(this.hintText.text)
    if (this.sub !== 'busy') this.setSub(this.sub)
  }

  protected onShutdown(): void {
    this.handTween?.stop()
    super.onShutdown()
  }
}
