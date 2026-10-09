/** Mesai sahnesi — Faz 2: tek siparişle oynanabilir çekirdek mekanik. */

import * as Phaser from 'phaser'
import { bus } from '@/bus'
import { FONTS } from '@/config/theme'
import { stageFor } from '@/core/difficulty'
import { generateOrder, type Order } from '@/core/orders'
import { Rng } from '@/core/rng'
import { evaluateServe, round1 } from '@/core/scoring'
import { glassSkin } from '@/data/cosmetics'
import { TEA_TYPES } from '@/data/orderTypes'
import { useInventoryStore } from '@/stores/inventory'
import type { Layout } from '../layout'
import { Background } from '../objects/Background'
import { DebugOverlay } from '../objects/DebugOverlay'
import { Station } from '../objects/Station'
import { runtime } from '../runtime'
import { BaseScene } from './BaseScene'

export class ShiftScene extends BaseScene {
  private bg!: Background
  private station!: Station
  private debug!: DebugOverlay
  private orderText!: Phaser.GameObjects.Text
  private resultText!: Phaser.GameObjects.Text
  private order!: Order
  private rng = new Rng(Date.now())
  private nextId = 1

  constructor() {
    super('Shift')
  }

  create() {
    this.setupBase()
    const L = this.L
    const inv = useInventoryStore()
    this.bg = new Background(this, runtime.venue, L)
    this.station = new Station(
      this,
      { glass: 'ince', skin: glassSkin(inv.equipped.glass), pot: inv.equipped.pot, gauge: 'numbers' },
      L,
    )
    this.orderText = this.add.text(0, 0, '', { fontFamily: FONTS.chalk, color: '#EDEDE4', align: 'center' }).setOrigin(0.5, 0)
    this.resultText = this.add
      .text(0, 0, '', { fontFamily: FONTS.ui, fontStyle: '900', color: '#FFF6E6', stroke: '#3B2416', align: 'center' })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0)
    this.debug = new DebugOverlay(this)
    this.debug.setVisible(new URLSearchParams(location.search).has('debug'))
    this.onBus('dev:overlay', (v) => this.debug.setVisible(v))
    this.onBus('game:quit', () => this.scene.start('Ambient'))
    this.station.events.on('serve', () => this.serve())
    this.station.events.on('overflow', () => this.showResult('Taştı!', 0xc0392b))
    this.newOrder()
    this.onResize(L)
  }

  private newOrder() {
    const served = this.nextId - 1
    this.order = generateOrder(this.rng, { served, stage: stageFor(served), nextId: this.nextId++ })
    this.station.setGlass(this.order.glass)
    this.station.setTargets(this.order.demTarget, this.order.fillTarget)
    this.orderText.setText(
      `${TEA_TYPES[this.order.teaType].name} · Dem %${this.order.demTarget} · Dolu %${this.order.fillTarget}` +
        (this.order.sugar ? ` · ${this.order.sugar} şeker` : ''),
    )
  }

  private serve() {
    const ev = evaluateServe({
      demPct: this.station.demPct,
      fillPct: this.station.fillPct,
      targetDem: this.order.demTarget,
      targetFill: this.order.fillTarget,
      sugarGiven: this.station.sugar,
      sugarTarget: this.order.sugar,
    })
    this.showResult(`İsabet %${round1(ev.accuracy)}\n${'★'.repeat(ev.stars)}${'☆'.repeat(3 - ev.stars)}`, 0x4e9a3a)
    bus.emit('audio:sfx', 'serve')
  }

  private showResult(text: string, _color: number) {
    this.station.setBusy(true)
    this.resultText.setText(text).setAlpha(1).setScale(0.6)
    this.tweens.add({ targets: this.resultText, scale: 1, duration: 300, ease: 'Back.easeOut' })
    this.time.delayedCall(1300, async () => {
      this.resultText.setAlpha(0)
      await this.station.slideOut(null)
      this.station.resetContents()
      this.newOrder()
      await this.station.slideIn()
      this.station.setBusy(false)
    })
  }

  update(_t: number, deltaMs: number) {
    const dt = Math.min(0.05, deltaMs / 1000)
    this.station.update(dt)
    this.debug.update(dt, this, this.station)
  }

  protected onResize(L: Layout): void {
    this.bg.layout(L)
    this.station.layout(L)
    this.orderText.setPosition(L.col.cx, L.board.y + 20 * L.u).setFontSize(Math.round(40 * L.u))
    this.resultText.setPosition(L.col.cx, L.board.y + L.board.h / 2 + 40 * L.u).setFontSize(Math.round(64 * L.u))
    this.resultText.setStroke('#3B2416', 10 * L.u)
    this.debug.place(L.col.x + 10 * L.u, L.hud.y, 22 * L.u)
  }

  protected onShutdown(): void {
    this.station?.destroy()
    this.debug?.destroy()
  }
}
