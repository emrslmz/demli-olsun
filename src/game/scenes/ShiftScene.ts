/**
 * Mesai (ana mod, sonsuz): müşteriler tek tek tezgâha gelir, balonda ne istediklerini gösterir.
 * Çayı doldur, servis et; isabet ve hız puan, kombo ve bahşiş getirir. Bekletilen, taşan ya da beğenilmeyen
 * çay can götürür. Zorluk aşamalarla artar (renk çubuğundaki yardım azalır, sabır kısalır, şeker istenir).
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
import { pct1, tr } from '@/i18n/tr'
import { services } from '@/services'
import { AudioService } from '@/services/audio/AudioService'
import { HapticsService } from '@/services/haptics/HapticsService'
import { useEconomyStore } from '@/stores/economy'
import { useInventoryStore } from '@/stores/inventory'
import type { Layout } from '../layout'
import { DEPTH } from '../objects/Background'
import { Hud } from '../objects/Hud'
import { runtime } from '../runtime'
import { PlayScene } from './PlayScene'

interface ActiveOrder {
  order: Order
  patience: number
  max: number
  warned: boolean
  /** Müşteri yürüyüp tezgâha vardı mı (sabır o zaman işlemeye başlar). */
  arrived: boolean
}

const STAGE_NOTES: Record<number, string> = {
  2: 'Şeker isteyenler geldi!',
  3: 'Renk işaretin artık yok: rengine bak!',
  4: 'Müşteriler acele ediyor',
  5: 'Göz kararı! Renk çubuğu da yok',
}

export class ShiftScene extends PlayScene {
  private hud!: Hud
  private rng = new Rng(1)
  private current: ActiveOrder | null = null
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
    this.current = null
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
    this.rush = { active: false, left: 0, nextAt: this.rng.int(RUSH.everyServes[0], RUSH.everyServes[1]) + 4, name: '' }
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
    this.onBus('game:continue', ({ granted }) => this.onContinue(granted))
    this.onBus('game:end-request', () => this.endShift())
    this.onBus('dev:stage', (stage) => {
      const target = [0, 0, 5, 12, 24, 40][stage] ?? 0
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
    this.floats.burst(this.L.col.cx, this.L.counterY - 60 * this.L.u, text, 44 * this.L.u, '#9FE3B0')
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
    if (s.stage === this.stage.stage) return
    this.stage = s
    this.applyGauge()
    const note = STAGE_NOTES[s.stage]
    if (announce && note) {
      this.floats.burst(this.L.col.cx, this.L.counterY - 40 * this.L.u, note, 40 * this.L.u, '#FFF6E6')
      AudioService.play('pop')
    }
  }

  // ---------- Müşteriler ----------

  private patienceRate(): number {
    let r = this.rush.active ? RUSH.patienceRate : 1
    const sabir = BOOSTERS.sabirTasi
    if (this.boosters.has('sabirTasi') && this.elapsed < (sabir.durationSec ?? 60)) r /= 1 + (sabir.patienceBonus ?? 0.5)
    return r
  }

  private async spawnCustomer(): Promise<void> {
    const g = this.gen
    const order = generateOrder(this.rng, {
      served: this.served,
      stage: this.stage,
      nextId: this.nextId++,
      lastCustomer: this.lastCustomer,
    })
    this.lastCustomer = order.customer
    const ao: ActiveOrder = { order, patience: order.patience, max: order.patience, warned: false, arrived: false }
    this.current = ao
    this.station.setTargets(order.demTarget, order.fillTarget)
    await this.customer.enter(order, useInventoryStore().equipped.glass)
    if (!this.alive(g) || this.current !== ao) return
    ao.arrived = true
    AudioService.play('pop', { rate: 0.9 })
    if (!this.busy && !this.over && !this.awaitingContinue) {
      this.station.setHasOrder(true)
      this.station.setInputEnabled(true)
    }
  }

  protected tick(dt: number): void {
    this.hud.update(dt)
    if (this.over || this.awaitingContinue) return
    this.elapsed += dt

    if (!this.current && !this.busy) {
      this.arrivalIn -= dt
      if (this.arrivalIn <= 0) void this.spawnCustomer()
    }

    const ao = this.current
    if (ao && ao.arrived && !this.busy) {
      ao.patience -= dt * this.patienceRate()
      const ratio = ao.patience / ao.max
      this.customer.setPatience(ratio)
      if (!ao.warned && ratio < PATIENCE.warnBelow) {
        ao.warned = true
        AudioService.play('tick')
      }
      if (ao.patience <= 0) void this.customerLeft()
    }

    if (this.rush.active) {
      this.rush.left -= dt
      this.hud.setRushProgress(this.rush.left / RUSH.duration)
      if (this.rush.left <= 0) this.endRush()
    } else if (this.stage.stage >= RUSH.minStage && this.served >= this.rush.nextAt) {
      this.startRush()
    }
  }

  protected inputAllowed(): boolean {
    return !this.busy && !this.over && !this.awaitingContinue && !!this.current?.arrived
  }

  // ---------- Servis ----------

  private async onServe(): Promise<void> {
    const ao = this.current
    if (!ao || this.busy || this.over) return
    const g = this.gen
    this.busy = true
    const st = this.station
    st.setInputEnabled(false)
    st.setBusy(true)
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
    this.customer.setExpression(ev.accepted ? (happy ? 'happy' : 'neutral') : 'angry')
    this.say(o.customer, bucket, () => this.rng.next())

    const L = this.L
    const glassTop = st.glass.topWorldY
    if (ev.accepted) {
      this.streak = nextStreak(this.streak, ev.accuracy)
      this.bestStreak = Math.max(this.bestStreak, this.streak)
      const combo = comboMultiplier(this.streak)
      const points = servePoints({
        accuracy: ev.accuracy,
        combo,
        gauge: this.gauge,
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
      bus.emit('shift:served', { accuracy: ev.accuracy, stars: ev.stars, tips })
      AudioService.play(ev.stars === 3 ? 'star' : 'serve')
      if (ev.stars === 3) HapticsService.trigger('stars3')
      this.floats.float(L.col.cx, glassTop - 40 * L.u, `%${pct1(round1(ev.accuracy))}`, 60 * L.u, '#FFF6E6', 70 * L.u, 1100)
      this.starsPop.show(L.col.cx, glassTop - 130 * L.u, ev.stars, 76 * L.u, (i) =>
        AudioService.play('star', { rate: 1 + i * 0.12, volume: 0.6 }),
      )
      this.floats.fly(
        L.col.cx + 120 * L.u,
        glassTop + 20 * L.u,
        `+${points}`,
        54 * L.u,
        this.hud.scoreTarget(),
        () => {
          this.score += points
          this.hud.setScore(this.score)
        },
        '#F6C445',
      )
      if (tips > 0) {
        const econ = useEconomyStore()
        this.coins.burst(
          { x: L.customer.cx, y: L.counterY - 80 * L.u },
          this.hud.coinTarget(),
          Math.ceil(tips / 2),
          50 * L.u,
          (i) => {
            AudioService.play('coin', { rate: 1 + (i % 4) * 0.08, volume: 0.6 })
            this.hud.bumpCoin()
          },
          this.reduced,
        )
        this.hud.setTips(econ.tips + this.tipsEarned)
      }
      if (this.streak >= 2) {
        const text = `${COMBO_TEXTS[(this.streak - 2) % COMBO_TEXTS.length]} ×${combo.toFixed(1).replace('.', ',')}`
        this.floats.burst(L.col.cx, glassTop - 230 * L.u, text, 54 * L.u)
        AudioService.play('combo', { rate: 1 + Math.min(0.5, this.streak * 0.04) })
        HapticsService.trigger('combo')
      }
      this.hud.setCombo(combo)
      await this.wait(500)
      if (!this.alive(g)) return
      // Bardak müşteriye gider, müşteri memnun ayrılır.
      await st.serveTo(this.customer.servePoint())
      if (!this.alive(g)) return
      void this.customer.leave(true)
    } else {
      this.streak = 0
      this.hud.setCombo(1)
      AudioService.play('reject')
      HapticsService.trigger('error')
      this.shakeCamera()
      this.loseLife()
      await this.wait(900)
      if (!this.alive(g)) return
      void this.customer.leave(false)
      await st.slideOut()
      if (!this.alive(g)) return
    }
    await this.nextGlass(g)
  }

  /** Yeni boş bardak gelir; sıradaki müşteri kısa süre sonra. */
  private async nextGlass(g: number): Promise<void> {
    const st = this.station
    this.current = null
    st.setHasOrder(false)
    st.setTargets(null, null)
    st.resetContents()
    this.refreshStage(true)
    await st.slideIn()
    if (!this.alive(g)) return
    this.busy = false
    st.setBusy(false)
    this.arrivalIn = this.rng.float(ARRIVAL.delay[0], ARRIVAL.delay[1])
  }

  private async onOverflow(): Promise<void> {
    if (this.over || this.busy) return
    const g = this.gen
    const ao = this.current
    this.busy = true
    const st = this.station
    st.setInputEnabled(false)
    st.setBusy(true)
    st.spill()
    this.shakeCamera()
    AudioService.play('overflow')
    HapticsService.trigger('error')
    this.streak = 0
    this.hud.setCombo(1)
    if (ao) {
      this.customer.setExpression('angry')
      this.say(ao.order.customer, 'overflow', () => this.rng.next())
      if (ao.order.customer === 'muhtar') {
        this.score = Math.max(0, this.score - SCORING.muhtarOverflowPenalty)
        this.hud.setScore(this.score)
        this.floats.float(this.L.col.cx, st.glass.topWorldY, `−${SCORING.muhtarOverflowPenalty}`, 56 * this.L.u, '#FF8A7A')
      }
    }
    this.floats.burst(this.L.col.cx, st.glass.topWorldY - 90 * this.L.u, tr.game.overflow, 64 * this.L.u, '#FF8A7A')
    this.loseLife()
    await this.wait(1000)
    if (!this.alive(g)) return
    if (ao) void this.customer.leave(false)
    await st.slideOut()
    if (!this.alive(g)) return
    await this.nextGlass(g)
  }

  /** Sabır bitti: müşteri kızgın gider, 1 can gider, bardaktaki çay dökülür. */
  private async customerLeft(): Promise<void> {
    const ao = this.current
    if (!ao || this.busy || this.over) return
    const g = this.gen
    this.busy = true
    const st = this.station
    st.setInputEnabled(false)
    st.setBusy(true)
    this.customer.setExpression('angry')
    this.say(ao.order.customer, 'left', () => this.rng.next())
    AudioService.play('reject', { rate: 0.85 })
    HapticsService.trigger('error')
    this.streak = 0
    this.hud.setCombo(1)
    this.loseLife()
    await this.wait(900)
    if (!this.alive(g)) return
    void this.customer.leave(false)
    if (st.dem + st.su > 0.0005 || st.sugar > 0) {
      await st.slideOut()
      if (!this.alive(g)) return
      await this.nextGlass(g)
    } else {
      this.current = null
      st.setHasOrder(false)
      st.setTargets(null, null)
      this.busy = false
      st.setBusy(false)
      this.arrivalIn = this.rng.float(ARRIVAL.delay[0], ARRIVAL.delay[1]) + 0.4
    }
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
      void this.wait(1300).then(() => {
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
    // Aktif müşterinin sabrı dolar.
    if (this.current) {
      this.current.patience = this.current.max
      this.current.warned = false
      this.customer.setPatience(1)
      this.customer.setExpression('neutral')
    }
    this.station.setInputEnabled(this.inputAllowed())
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
    this.hud.showRush(this.rush.name)
    AudioService.play('whoosh')
    this.showCrowd(true)
  }

  private endRush(): void {
    this.rush.active = false
    this.rush.nextAt = this.served + this.rng.int(RUSH.everyServes[0], RUSH.everyServes[1])
    this.hud.hideRush()
    this.showCrowd(false)
  }

  /** Arka plan kalabalıklaşır: müşterinin arkasında bekleşen flu siluetler. */
  private showCrowd(on: boolean): void {
    const L = this.L
    if (on) {
      const n = runtime.lowQuality ? 2 : 4
      for (let i = 0; i < n; i++) {
        const id = customerImageId(this.rng.pick(CUSTOMER_IDS), 'neutral')
        const side = i % 2 ? 1 : -1
        const x = L.col.cx + side * L.col.w * (0.3 + 0.16 * Math.floor(i / 2))
        const s = L.customer.size * 0.62
        const img = this.add
          .image(x + side * 300 * L.u, L.counterY + 10 * L.u, id)
          .setOrigin(0.5, 1)
          .setDisplaySize(s, s)
          .setDepth(DEPTH.customer - 5)
        img.setTint(0x8a6a58).setAlpha(0)
        img.setFlipX(side > 0)
        this.crowd.push(img)
        this.tweens.add({ targets: img, x, alpha: 0.7, duration: 500, delay: i * 90, ease: 'Cubic.easeOut' })
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
    return `aşama ${this.stage.stage} · servis ${this.served}${this.rush.active ? ' · YOĞUN' : ''}`
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
