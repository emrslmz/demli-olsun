/**
 * Günün Siparişi: herkese aynı tek sipariş (tarih seed'li), tek hak, renk çubuğunda yalnızca hedef,
 * o güne özel akış hızı. Süre biterse bardak olduğu gibi servis edilir. Sonuç Vue'ya 'daily:finished' ile gider.
 */

import type * as Phaser from 'phaser'
import { bus, type DailyStartOptions } from '@/bus'
import { DAILY_REWARD } from '@/config/economy'
import { FONTS } from '@/config/theme'
import type { DailyChallenge } from '@/core/daily'
import { effectiveGauge } from '@/core/difficulty'
import { Rng } from '@/core/rng'
import { evaluateServe, round1, type ServeEvaluation } from '@/core/scoring'
import { bucketFor, type LineBucket } from '@/data/lines'
import { fmt, pct, tr } from '@/i18n/tr'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { useEconomyStore } from '@/stores/economy'
import { useInventoryStore } from '@/stores/inventory'
import type { Layout } from '../layout'
import { Hud } from '../objects/Hud'
import { PlayScene } from './PlayScene'

export class DailyScene extends PlayScene {
  private challenge!: DailyChallenge
  private rng!: Rng
  private hud!: Hud
  private hasCustomer = false
  private patience = 0
  private maxPatience = 1
  private started = false
  private done = false
  private elapsed = 0
  private warned = false
  private note!: Phaser.GameObjects.Text

  constructor() {
    super('Daily')
  }

  create(data: DailyStartOptions) {
    this.challenge = data.challenge
    this.rng = new Rng(`daily-fx:${this.challenge.dateKey}`)
    this.hasCustomer = false
    this.started = false
    this.done = false
    this.elapsed = 0
    this.warned = false
    this.createPlay({
      glass: 'ince',
      gauge: effectiveGauge('marks', { colorBlind: false, ustaGozu: false }),
      flowScale: this.challenge.flowScale,
      seedRand: () => this.rng.next(),
    })
    this.station.setGaugeMode(effectiveGauge('marks', { colorBlind: this.colorBlind, ustaGozu: false }))
    this.hud = new Hud(this, this.L)
    this.hud.setDailyMode(fmt(tr.daily.title, { n: this.challenge.dayNumber }))
    this.hud.setTips(useEconomyStore().tips)
    this.hud.onPause = () => {
      if (!this.done) bus.emit('game:pause-request')
    }
    this.note = this.add
      .text(0, 0, tr.daily.oneShot, { fontFamily: FONTS.chalk, fontStyle: '800', fontSize: '32px', color: '#FFF6E6', align: 'center' })
      .setOrigin(0.5)
      .setDepth(120)
      .setStroke('#3B2416', 8)
    this.station.setHasOrder(false)
    this.station.events.on('serve', () => void this.serve(false))
    this.station.events.on('overflow', () => void this.onOverflow())
    this.onBus('game:end-request', () => void this.serve(true))
    this.onResize(this.L)
    void this.begin()
  }

  private async begin(): Promise<void> {
    const g = this.gen
    await this.wait(500)
    if (!this.alive(g)) return
    const order = this.challenge.order
    this.station.setTargets(order.demTarget, order.fillTarget)
    await this.customer.enter(order, useInventoryStore().equipped.glass)
    if (!this.alive(g)) return
    this.hasCustomer = true
    AudioService.play('pop')
    this.patience = order.patience
    this.maxPatience = order.patience
    await this.wait(300)
    if (!this.alive(g)) return
    this.station.setHasOrder(true)
    this.station.setInputEnabled(true)
    this.started = true
    this.time.delayedCall(4200, () => {
      if (this.note.active) this.tweens.add({ targets: this.note, alpha: 0, duration: 500 })
    })
  }

  protected tick(dt: number): void {
    this.hud.update(dt)
    if (!this.started || this.done || !this.hasCustomer) return
    this.elapsed += dt
    this.patience -= dt
    const ratio = Math.max(0, this.patience / this.maxPatience)
    this.customer.setPatience(ratio)
    if (!this.warned && ratio < 0.2) {
      this.warned = true
      this.say(this.challenge.order.customer, 'impatient', () => this.rng.next())
      AudioService.play('tick')
    }
    if (this.patience <= 0) void this.serve(true)
  }

  protected inputAllowed(): boolean {
    return this.started && !this.done
  }

  /** Servis (oyuncu ya da süre/çıkış). Tek hak: ikinci kez çağrılmaz. */
  private async serve(forced: boolean): Promise<void> {
    if (this.done || !this.hasCustomer) return
    this.done = true
    const g = this.gen
    const st = this.station
    const order = this.challenge.order
    st.setInputEnabled(false)
    st.setBusy(true)
    if (forced) {
      st.stopPour()
      if (this.patience <= 0) this.floats.burst(this.L.col.cx, st.glass.topWorldY - 90 * this.L.u, tr.game.timeUp, 52 * this.L.u, '#FFD27A')
    }
    const empty = st.volume <= 0.001
    const ev = evaluateServe({
      demPct: st.demPct,
      fillPct: st.fillPct,
      targetDem: order.demTarget,
      targetFill: order.fillTarget,
      sugarGiven: st.sugar,
      sugarTarget: order.sugar,
    })
    const result = empty ? { ...ev, accuracy: 0, demScore: 0, fillScore: 0, stars: 0 as const, accepted: false } : ev
    HapticsService.trigger('serve')
    if (!empty) await st.stir(this.reduced)
    if (!this.alive(g)) return
    const bucket: LineBucket = empty ? 'left' : bucketFor(result.accuracy, result.accepted)
    await this.react(result, bucket, g)
  }

  private async onOverflow(): Promise<void> {
    if (this.done || !this.hasCustomer) return
    this.done = true
    const g = this.gen
    const st = this.station
    st.setInputEnabled(false)
    st.setBusy(true)
    st.spill()
    this.shakeCamera()
    AudioService.play('overflow')
    HapticsService.trigger('error')
    this.floats.burst(this.L.col.cx, st.glass.topWorldY - 90 * this.L.u, tr.game.overflow, 60 * this.L.u, '#FF8A7A')
    const order = this.challenge.order
    const ev = evaluateServe({
      demPct: st.demPct,
      fillPct: st.fillPct,
      targetDem: order.demTarget,
      targetFill: order.fillTarget,
      sugarGiven: st.sugar,
      sugarTarget: order.sugar,
      overflowed: true,
    })
    await this.react({ ...ev, accuracy: 0, stars: 0, accepted: false }, 'overflow', g)
  }

  private async react(ev: ServeEvaluation, bucket: LineBucket, g: number): Promise<void> {
    if (!this.hasCustomer) return
    const st = this.station
    const order = this.challenge.order
    const L = this.L
    const happy = ev.accepted && (order.customer === 'riza' ? ev.stars === 3 : ev.stars >= 2)
    this.customer.setExpression(ev.accepted ? (happy ? 'happy' : 'neutral') : 'angry')
    const line = this.say(order.customer, bucket, () => this.rng.next())
    const top = st.glass.topWorldY
    if (ev.accepted) {
      AudioService.play(ev.stars === 3 ? 'star' : 'serve')
      if (ev.stars === 3) HapticsService.trigger('stars3')
    } else {
      AudioService.play('reject')
      HapticsService.trigger('error')
      this.shakeCamera()
    }
    this.floats.float(L.col.cx, top - 40 * L.u, pct(round1(ev.accuracy)), 64 * L.u, '#FFF6E6', 80 * L.u, 1600)
    this.starsPop.show(L.col.cx, top - 130 * L.u, ev.stars, 76 * L.u, (i) => AudioService.play('star', { rate: 1 + i * 0.12, volume: 0.6 }))
    const tips = ev.accepted ? DAILY_REWARD.base + DAILY_REWARD.perStar * ev.stars : DAILY_REWARD.rejected
    // Sonuç ekranı gelmeden: kabul edilen bardak müşteriye gider, beğenilmeyen geri çekilir.
    const demPct = round1(st.demPct)
    const fillPct = round1(st.fillPct)
    const sugarGiven = st.sugar
    await this.wait(900)
    if (!this.alive(g)) return
    if (ev.accepted) await st.serveTo(this.customer.servePoint())
    else await st.slideOut()
    if (!this.alive(g)) return
    void this.customer.leave(happy)
    await this.wait(700)
    if (!this.alive(g)) return
    bus.emit('daily:finished', {
      dateKey: this.challenge.dateKey,
      dayNumber: this.challenge.dayNumber,
      customer: order.customer,
      accuracy: round1(ev.accuracy),
      demScore: ev.demScore,
      fillScore: ev.fillScore,
      stars: ev.stars,
      accepted: ev.accepted,
      line,
      timeSec: Math.round(this.elapsed * 10) / 10,
      demPct,
      fillPct,
      targetDem: order.demTarget,
      targetFill: order.fillTarget,
      sugarGiven,
      sugarTarget: order.sugar,
      tips,
    })
  }

  protected onSettingsChanged(): void {
    this.station.setGaugeMode(effectiveGauge('marks', { colorBlind: this.colorBlind, ustaGozu: false }))
  }

  protected onResize(L: Layout): void {
    this.layoutPlay(L)
    this.hud?.layout(L)
    this.note?.setFontSize(Math.round(42 * L.u)).setPosition(L.col.cx, L.hud.y + L.hud.h + 56 * L.u)
    this.note?.setStroke('#3B2416', 10 * L.u).setWordWrapWidth(L.col.w * 0.86)
  }

  protected onShutdown(): void {
    this.hud?.destroy()
    super.onShutdown()
  }
}
