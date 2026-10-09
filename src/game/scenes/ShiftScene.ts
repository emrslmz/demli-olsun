/**
 * Mesai (ana mod, sonsuz): siparişler geldikçe zorlaşır. Sipariş tablosu, müşteriler, replikler, sabır, can,
 * zorluk aşamaları, şeker, bardak tipleri, yoğun saat, HUD ve oyun sonu.
 */

import * as Phaser from 'phaser'
import { bus, type ShiftStartOptions } from '@/bus'
import { ARRIVAL, LIVES, PATIENCE, RUSH, SCORING, type GaugeMode, type StageConfig } from '@/config/gameplay'
import { BOOSTERS, CONTINUE_COST, type BoosterId } from '@/config/economy'
import { effectiveGauge, stageFor } from '@/core/difficulty'
import { generateOrder, type Order } from '@/core/orders'
import { Rng } from '@/core/rng'
import { comboMultiplier, evaluateServe, nextStreak, round1, servePoints, tipFor } from '@/core/scoring'
import { CUSTOMERS, CUSTOMER_IDS, customerImageId, type CustomerId } from '@/data/customers'
import { bucketFor, COMBO_TEXTS } from '@/data/lines'
import { pct1 } from '@/i18n/tr'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { services } from '@/services'
import { useEconomyStore } from '@/stores/economy'
import type { Layout } from '../layout'
import { runtime } from '../runtime'
import { Hud } from '../objects/Hud'
import type { OrderCard } from '../objects/OrderBoard'
import { PlayScene } from './PlayScene'

interface ActiveOrder {
  order: Order
  card: OrderCard
  patience: number
  max: number
  trayServed: number
  warned: boolean
}

const STAGE_NOTES: Record<number, string> = {
  2: 'Aşama 2 · Düz bardak geldi, şeker istenebilir',
  3: 'Aşama 3 · Göstergelerde sadece işaret',
  4: 'Aşama 4 · Porselen fincan: kulağına güven',
  5: 'Aşama 5 · Göz kararı! Tepsi siparişleri başladı',
}

export class ShiftScene extends PlayScene {
  private hud!: Hud
  private rng = new Rng(1)
  private orders: ActiveOrder[] = []
  private nextId = 1
  private lastCustomer: CustomerId | undefined
  private arrivalIn = 0
  private busy = false
  private over = false
  private awaitingContinue = false
  private boosters = new Set<BoosterId>()
  private stage!: StageConfig
  private gauge: GaugeMode = 'numbers'
  private gaugeOverride: GaugeMode | null = null
  private crowd: Phaser.GameObjects.Image[] = []

  private served = 0
  private score = 0
  private lives = LIVES
  private maxLives = LIVES
  private streak = 0
  private bestStreak = 0
  private tipsEarned = 0
  private accSum = 0
  private accN = 0
  private stars3 = 0
  private elapsed = 0
  private continued = false
  private rush = { active: false, left: 0, nextAt: 0, name: '' }

  constructor() {
    super('Shift')
  }

  create(data: ShiftStartOptions) {
    this.rng = new Rng(Date.now())
    this.boosters = new Set(data?.boosters ?? [])
    this.orders = []
    this.nextId = 1
    this.lastCustomer = undefined
    this.arrivalIn = ARRIVAL.firstDelay
    this.busy = false
    this.over = false
    this.awaitingContinue = false
    this.served = 0
    this.score = 0
    this.maxLives = LIVES + (this.boosters.has('yedekBardak') ? 1 : 0)
    this.lives = this.maxLives
    this.streak = 0
    this.bestStreak = 0
    this.tipsEarned = 0
    this.accSum = 0
    this.accN = 0
    this.stars3 = 0
    this.elapsed = 0
    this.continued = false
    this.gaugeOverride = null
    this.crowd = []
    this.stage = stageFor(0)
    this.rush = { active: false, left: 0, nextAt: this.rng.int(RUSH.everyServes[0], RUSH.everyServes[1]) + 5, name: '' }
    this.gauge = this.computeGauge()
    this.createPlay({ glass: 'ince', gauge: this.gauge, seedRand: () => this.rng.next() })
    this.hud = new Hud(this, this.L)
    this.hud.setLives(this.lives, this.maxLives)
    this.hud.setScore(0)
    this.hud.setTips(useEconomyStore().tips)
    this.hud.onPause = () => {
      if (!this.over) bus.emit('game:pause-request')
    }
    this.station.setHasOrder(false)
    this.station.events.on('serve', () => void this.onServe())
    this.station.events.on('overflow', () => void this.onOverflow())
    this.station.events.on('sugar', (n: number) => this.orders[0]?.card.setSugarGiven(n))
    this.onBus('game:continue', ({ granted }) => this.onContinue(granted))
    this.onBus('game:end-request', () => this.endShift())
    this.onBus('dev:stage', (stage) => {
      const target = [0, 0, 5, 15, 30, 50][stage] ?? 0
      this.served = target
      this.refreshStage(true)
    })
    this.onBus('dev:gauge', (g) => {
      this.gaugeOverride = g
      this.applyGauge()
    })
    if (this.boosters.size > 0) this.showBoosterNote()
    this.onResize(this.L)
  }

  private showBoosterNote(): void {
    const names: Record<BoosterId, string> = { ustaGozu: 'Usta Gözü', sabirTasi: 'Sabır Taşı', yedekBardak: 'Yedek Bardak' }
    const text = [...this.boosters].map((b) => names[b]).join(' · ')
    this.floats.burst(this.L.col.cx, this.L.counterY - this.L.glassUnit * 1.6, text, 44 * this.L.u, '#9FE3B0')
  }

  // ---------- Zorluk ----------

  private computeGauge(): GaugeMode {
    if (this.gaugeOverride) return this.gaugeOverride
    return effectiveGauge(this.stage.gauge, { colorBlind: this.colorBlind, ustaGozu: this.boosters.has('ustaGozu') })
  }

  private applyGauge(): void {
    this.gauge = this.computeGauge()
    this.station.setGaugeMode(this.gauge)
  }

  protected onSettingsChanged(): void {
    this.applyGauge()
  }

  private refreshStage(announce: boolean): void {
    const s = stageFor(this.served)
    if (s.stage !== this.stage.stage) {
      this.stage = s
      this.applyGauge()
      const note = STAGE_NOTES[s.stage]
      if (announce && note) {
        this.floats.burst(this.L.col.cx, this.L.board.y + this.L.board.h + 70 * this.L.u, note, 36 * this.L.u, '#FFF6E6')
        AudioService.play('chalk')
      }
    }
  }

  private get capacity(): number {
    const extra = this.rush.active ? RUSH.extraQueue : 0
    return Math.min(this.board.capacity, this.stage.queue + extra)
  }

  // ---------- Siparişler ----------

  private spawnOrder(): void {
    const order = generateOrder(this.rng, {
      served: this.served,
      stage: this.stage,
      nextId: this.nextId++,
      lastCustomer: this.lastCustomer,
    })
    this.lastCustomer = order.customer
    const card = this.board.addCard(order)
    const ao: ActiveOrder = { order, card, patience: order.patience, max: order.patience, trayServed: 0, warned: false }
    this.orders.push(ao)
    AudioService.play('chalk', { rate: 1.1 })
    if (this.orders.length === 1) this.activateHead()
    else card.setActive(false, this.reduced)
  }

  /** İlk sipariş aktif olur: bardak tipi, hedefler, şeker göstergesi. */
  private activateHead(): void {
    const head = this.orders[0]
    this.orders.forEach((o, i) => o.card.setActive(i === 0, this.reduced))
    if (!head) {
      this.station.setTargets(null, null)
      this.station.setHasOrder(false)
      return
    }
    const st = this.station
    if (st.dem + st.su <= 0.0005 && st.sugar === 0) {
      if (st.glass.type !== head.order.glass) st.setGlass(head.order.glass)
    }
    st.setTargets(head.order.demTarget, head.order.fillTarget)
    st.setHasOrder(!this.busy && !this.over)
    head.card.setSugarGiven(st.sugar)
    head.card.setTrayServed(head.trayServed)
  }

  private patienceRate(index: number): number {
    let r = index === 0 ? 1 : PATIENCE.waitingRate
    const sabir = BOOSTERS.sabirTasi
    if (this.boosters.has('sabirTasi') && this.elapsed < (sabir.durationSec ?? 60)) r /= 1 + (sabir.patienceBonus ?? 0.5)
    return r
  }

  protected tick(dt: number): void {
    this.hud.update(dt)
    if (this.over || this.awaitingContinue) return
    this.elapsed += dt

    // Gelen siparişler
    if (this.orders.length < this.capacity) {
      this.arrivalIn -= dt * (this.rush.active ? 1 / RUSH.arrivalFactor : 1) * (this.orders.length === 0 ? 2.5 : 1)
      if (this.arrivalIn <= 0) {
        this.spawnOrder()
        this.arrivalIn = this.rng.float(ARRIVAL.delay[0], ARRIVAL.delay[1])
      }
    }

    // Sabır
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const o = this.orders[i] as ActiveOrder
      if (i === 0 && this.busy) continue
      o.patience -= dt * this.patienceRate(i)
      const ratio = o.patience / o.max
      o.card.setPatience(ratio)
      if (!o.warned && ratio < PATIENCE.warnBelow) {
        o.warned = true
        this.say(o.card, o.order.customer, 'impatient', () => this.rng.next())
        AudioService.play('tick')
      }
      if (o.patience <= 0) this.customerLeft(i)
    }

    // Yoğun saat
    if (this.rush.active) {
      this.rush.left -= dt
      this.board.setRushProgress(this.rush.left / RUSH.duration)
      if (this.rush.left <= 0) this.endRush()
    } else if (this.stage.stage >= RUSH.minStage && this.served >= this.rush.nextAt) {
      this.startRush()
    }
  }

  protected inputAllowed(): boolean {
    return !this.busy && !this.over && !this.awaitingContinue
  }

  // ---------- Servis ----------

  private async onServe(): Promise<void> {
    const ao = this.orders[0]
    if (!ao || this.busy || this.over) return
    const g = this.gen
    this.busy = true
    this.station.setInputEnabled(false)
    this.station.setBusy(true)
    const st = this.station
    const o = ao.order
    const ev = evaluateServe({
      demPct: st.demPct,
      fillPct: st.fillPct,
      targetDem: o.demTarget,
      targetFill: o.fillTarget,
      sugarGiven: st.sugar,
      sugarTarget: o.sugar,
    })
    HapticsService.trigger('serve')
    await st.stir(this.reduced)
    if (!this.alive(g)) return

    const bucket = bucketFor(ev.accuracy, ev.accepted)
    const happy = ev.accepted && (o.customer === 'riza' ? ev.stars === 3 : ev.stars >= 2)
    ao.card.setExpression(ev.accepted ? (happy ? 'happy' : 'neutral') : 'angry')
    this.say(ao.card, o.customer, bucket, () => this.rng.next())

    const L = this.L
    const glassTop = st.glass.topWorldY
    if (ev.accepted) {
      this.streak = nextStreak(this.streak, ev.accuracy)
      this.bestStreak = Math.max(this.bestStreak, this.streak)
      const combo = comboMultiplier(this.streak)
      const gaugeForScore: GaugeMode = this.gauge
      const points = servePoints({
        accuracy: ev.accuracy,
        combo,
        gauge: gaugeForScore,
        patienceRatio: ao.patience / ao.max,
        rushMultiplier: this.rush.active ? RUSH.multiplier : 1,
        accepted: true,
      })
      const tips = tipFor(o.customer, CUSTOMERS[o.customer].tip, ev)
      this.served++
      this.accSum += ev.accuracy
      this.accN++
      if (ev.stars === 3) this.stars3++
      this.tipsEarned += tips
      ao.trayServed++
      ao.card.setTrayServed(ao.trayServed)
      bus.emit('shift:served', { accuracy: ev.accuracy, stars: ev.stars, tips })
      AudioService.play(ev.stars === 3 ? 'star' : 'serve')
      if (ev.stars === 3) HapticsService.trigger('stars3')
      // Önce replik, ardından puan sayarak gelir.
      void this.wait(380).then(() => {
        if (!this.alive(g)) return
        this.floats.float(L.col.cx, glassTop - 40 * L.u, `%${pct1(round1(ev.accuracy))}`, 56 * L.u, '#FFF6E6', 70 * L.u, 1100)
        this.starsPop.show(L.col.cx, glassTop - 120 * L.u, ev.stars, 70 * L.u, (i) => AudioService.play('star', { rate: 1 + i * 0.12, volume: 0.6 }))
        this.floats.fly(L.col.cx + 120 * L.u, glassTop + 20 * L.u, `+${points}`, 50 * L.u, this.hud.scoreTarget(), () => {
          this.score += points
          this.hud.setScore(this.score)
        }, '#F6C445')
        if (tips > 0) {
          const econ = useEconomyStore()
          this.coins.burst({ x: L.col.cx - 60 * L.u, y: glassTop }, this.hud.coinTarget(), Math.ceil(tips / 2), 48 * L.u, (i) => {
            AudioService.play('coin', { rate: 1 + (i % 4) * 0.08, volume: 0.6 })
            this.hud.bumpCoin()
          }, this.reduced)
          this.hud.setTips(econ.tips + this.tipsEarned)
        }
        if (this.streak >= 2) {
          const text = `${COMBO_TEXTS[(this.streak - 2) % COMBO_TEXTS.length]} ×${combo.toFixed(1).replace('.', ',')}`
          this.floats.burst(L.col.cx, glassTop - 220 * L.u, text, 52 * L.u)
          AudioService.play('combo', { rate: 1 + Math.min(0.5, this.streak * 0.04) })
          HapticsService.trigger('combo')
        }
        this.hud.setCombo(combo)
      })
    } else {
      this.streak = 0
      this.hud.setCombo(1)
      AudioService.play('reject')
      HapticsService.trigger('error')
      ao.card.showX()
      this.board.shake()
      this.loseLife()
    }

    await this.wait(ev.accepted ? 650 : 900)
    if (!this.alive(g)) return
    await st.slideOut(ev.accepted ? this.tray : null)
    if (!this.alive(g)) return
    st.resetContents()

    const done = !ev.accepted || ao.trayServed >= o.trayCount
    if (done) {
      this.board.removeCard(ao.card, ev.accepted)
      const idx = this.orders.indexOf(ao)
      if (idx >= 0) this.orders.splice(idx, 1)
    }
    this.refreshStage(true)
    const next = this.orders[0]
    st.setGlass(next ? next.order.glass : 'ince')
    await st.slideIn()
    if (!this.alive(g)) return
    this.busy = false
    st.setBusy(false)
    st.setInputEnabled(this.inputAllowed())
    this.activateHead()
  }

  private async onOverflow(): Promise<void> {
    if (this.over) return
    const g = this.gen
    const ao = this.orders[0]
    this.busy = true
    this.station.setInputEnabled(false)
    this.station.setBusy(true)
    this.station.spill()
    this.shakeCamera()
    AudioService.play('overflow')
    HapticsService.trigger('error')
    this.streak = 0
    this.hud.setCombo(1)
    if (ao) {
      ao.card.showX()
      ao.card.setExpression('angry')
      this.say(ao.card, ao.order.customer, 'overflow', () => this.rng.next())
      if (ao.order.customer === 'muhtar') {
        this.score = Math.max(0, this.score - SCORING.muhtarOverflowPenalty)
        this.hud.setScore(this.score)
        this.floats.float(this.L.col.cx, this.station.glass.topWorldY, `−${SCORING.muhtarOverflowPenalty}`, 54 * this.L.u, '#FF8A7A')
      }
    }
    this.floats.burst(this.L.col.cx, this.station.glass.topWorldY - 90 * this.L.u, 'Taştı!', 60 * this.L.u, '#FF8A7A')
    this.loseLife()
    await this.wait(1000)
    if (!this.alive(g)) return
    await this.station.slideOut(null)
    if (!this.alive(g)) return
    this.station.resetContents()
    if (ao) {
      this.board.removeCard(ao.card, false)
      const idx = this.orders.indexOf(ao)
      if (idx >= 0) this.orders.splice(idx, 1)
    }
    const next = this.orders[0]
    this.station.setGlass(next ? next.order.glass : 'ince')
    await this.station.slideIn()
    if (!this.alive(g)) return
    this.busy = false
    this.station.setBusy(false)
    this.station.setInputEnabled(this.inputAllowed())
    this.activateHead()
  }

  /** Sabır bitti: müşteri kızgın gider, 1 can gider. */
  private customerLeft(index: number): void {
    const ao = this.orders[index]
    if (!ao) return
    ao.card.setExpression('angry')
    this.say(ao.card, ao.order.customer, 'left', () => this.rng.next())
    AudioService.play('reject', { rate: 0.85 })
    HapticsService.trigger('error')
    this.orders.splice(index, 1)
    this.board.removeCard(ao.card, false)
    this.streak = 0
    this.hud.setCombo(1)
    this.loseLife()
    if (index === 0 && !this.busy) void this.discardGlass()
    else this.activateHead()
  }

  /** Aktif sipariş gittiyse bardaktaki çay dökülür, yeni bardak gelir. */
  private async discardGlass(): Promise<void> {
    const st = this.station
    if (st.dem + st.su <= 0.0005 && st.sugar === 0) {
      this.activateHead()
      return
    }
    const g = this.gen
    this.busy = true
    st.setInputEnabled(false)
    st.setBusy(true)
    await st.slideOut(null)
    if (!this.alive(g)) return
    st.resetContents()
    const next = this.orders[0]
    st.setGlass(next ? next.order.glass : 'ince')
    await st.slideIn()
    if (!this.alive(g)) return
    this.busy = false
    st.setBusy(false)
    st.setInputEnabled(this.inputAllowed())
    this.activateHead()
  }

  // ---------- Can ve oyun sonu ----------

  private loseLife(): void {
    if (this.over) return
    this.lives = Math.max(0, this.lives - 1)
    this.hud.setLives(this.lives, this.maxLives, true)
    AudioService.play('lifeLost')
    HapticsService.trigger('lifeLost')
    if (this.lives <= 0) {
      this.awaitingContinue = true
      this.station.setInputEnabled(false)
      const g = this.gen
      void this.wait(900).then(() => {
        if (!this.alive(g)) return
        if (!this.continued) {
          bus.emit('game:continue-offer', { adAvailable: services.ads.isRewardedReady(), cost: CONTINUE_COST })
        } else {
          this.endShift()
        }
      })
    }
  }

  private onContinue(granted: boolean): void {
    if (!this.awaitingContinue || this.over) return
    if (!granted) {
      this.endShift()
      return
    }
    this.continued = true
    this.awaitingContinue = false
    this.lives = 1
    this.hud.setLives(this.lives, this.maxLives)
    // Aktif sipariş sıfırlanır: sabırlar dolar, bardak boşalır.
    for (const o of this.orders) {
      o.patience = o.max
      o.warned = false
      o.card.setPatience(1)
      o.card.setExpression('neutral')
    }
    void this.discardGlass().then(() => this.station.setInputEnabled(this.inputAllowed()))
    AudioService.play('purchase')
  }

  private endShift(): void {
    if (this.over) return
    this.over = true
    this.awaitingContinue = false
    this.station.setInputEnabled(false)
    this.station.setHasOrder(false)
    if (this.rush.active) this.endRush()
    this.hud.setVisible(false)
    bus.emit('game:over', {
      score: this.score,
      served: this.served,
      avgAccuracy: this.accN > 0 ? this.accSum / this.accN : 0,
      tipsEarned: this.tipsEarned,
      bestCombo: this.bestStreak,
      stars3: this.stars3,
      stage: this.stage.stage,
      durationSec: Math.round(this.elapsed),
      continued: this.continued,
    })
  }

  // ---------- Yoğun saat ----------

  private startRush(): void {
    this.rush.active = true
    this.rush.left = RUSH.duration
    this.rush.name = this.rng.pick(RUSH.names)
    this.board.showRush(this.rush.name)
    AudioService.play('whoosh')
    this.showCrowd(true)
  }

  private endRush(): void {
    this.rush.active = false
    this.rush.nextAt = this.served + this.rng.int(RUSH.everyServes[0], RUSH.everyServes[1])
    this.board.hideRush()
    this.showCrowd(false)
  }

  /** Arka plan kalabalıklaşır: tezgâhın arkasında flu müşteri siluetleri. */
  private showCrowd(on: boolean): void {
    const L = this.L
    if (on) {
      const n = runtime.lowQuality ? 3 : 6
      for (let i = 0; i < n; i++) {
        const id = customerImageId(this.rng.pick(CUSTOMER_IDS), 'neutral')
        const side = i % 2 ? 1 : -1
        const x = L.col.cx + side * (L.col.w * (0.22 + 0.13 * Math.floor(i / 2)))
        const s = 300 * L.u
        const img = this.add.image(x + side * 300 * L.u, L.counterY + 10 * L.u, id).setOrigin(0.5, 1).setDisplaySize(s, s).setDepth(-50)
        img.setTint(0x6a4a38).setAlpha(0)
        img.setFlipX(side > 0)
        this.crowd.push(img)
        this.tweens.add({ targets: img, x, alpha: 0.55, duration: 500, delay: i * 90, ease: 'Cubic.easeOut' })
        this.tweens.add({ targets: img, y: img.y - 8 * L.u, duration: 600 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      }
    } else {
      for (const img of this.crowd) {
        this.tweens.add({ targets: img, alpha: 0, duration: 400, onComplete: () => img.destroy() })
      }
      this.crowd = []
    }
  }

  protected debugExtra(): string {
    return `aşama ${this.stage.stage} · servis ${this.served} · kuyruk ${this.orders.length}/${this.capacity}${this.rush.active ? ' · YOĞUN' : ''}`
  }

  protected onResize(L: Layout): void {
    this.layoutPlay(L)
    this.hud?.layout(L)
  }

  protected onShutdown(): void {
    this.hud?.destroy()
    super.onShutdown()
  }
}

