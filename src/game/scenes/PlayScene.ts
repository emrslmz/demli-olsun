/**
 * Oynanan sahnelerin (Mesai, Günlük, Eğitim) ortak tabanı: arka plan + tezgâh, tezgâhın arkasındaki müşteri,
 * servis istasyonu, efektler, duraklatma, ses/titreşim köprüsü, hareket azaltma.
 */

import { DEV, type GaugeMode } from '@/config/gameplay'
import type { GlassProfileId } from '@/core/glassModel'
import { glassSkin } from '@/data/cosmetics'
import type { CustomerId } from '@/data/customers'
import { BUCKET_EMOJI, pickLine, type LineBucket } from '@/data/lines'
import { AudioService } from '@/services/audio/AudioService'
import { useInventoryStore } from '@/stores/inventory'
import { saveNow } from '@/stores/persist'
import { useSettingsStore } from '@/stores/settings'
import { CoinBurst } from '../fx/CoinBurst'
import { FloatTexts, StarsPop } from '../fx/Popups'
import type { Layout } from '../layout'
import { Background } from '../objects/Background'
import { DebugOverlay } from '../objects/DebugOverlay'
import { CustomerView } from '../objects/CustomerView'
import { Station } from '../objects/Station'
import { ThemeFx } from '../objects/ThemeFx'
import { runtime } from '../runtime'
import { BaseScene } from './BaseScene'

export abstract class PlayScene extends BaseScene {
  protected bg!: Background
  protected station!: Station
  protected customer!: CustomerView
  protected floats!: FloatTexts
  protected starsPop!: StarsPop
  protected coins!: CoinBurst
  protected debug!: DebugOverlay
  protected themeFx!: ThemeFx
  protected reduced = false
  protected colorBlind = false
  protected paused = false
  /** Async akışlar sahne kapandıktan sonra çalışmasın diye nesil sayacı. */
  protected gen = 0
  private fpsT = 0
  private fpsFrames = 0
  private fpsChecked = false

  protected createPlay(cfg: {
    glass: GlassProfileId
    gauge: GaugeMode
    flowScale?: { dem: number; su: number }
    seedRand?: () => number
  }): void {
    this.setupBase()
    this.gen++
    this.paused = false
    this.fpsT = 0
    this.fpsFrames = 0
    this.fpsChecked = runtime.lowQuality || new URLSearchParams(location.search).has('hq')
    const L = this.L
    const inv = useInventoryStore()
    const settings = useSettingsStore()
    this.reduced = settings.data.reducedMotion
    this.colorBlind = settings.data.colorBlind
    runtime.venue = inv.equipped.venue
    this.bg = new Background(this, runtime.venue, L)
    this.themeFx = new ThemeFx(this, L, this.reduced || runtime.lowQuality)
    this.station = new Station(
      this,
      {
        glass: cfg.glass,
        skin: glassSkin(inv.equipped.glass),
        pot: inv.equipped.pot,
        gauge: cfg.gauge,
        flowScale: cfg.flowScale,
        rand: cfg.seedRand,
        reducedMotion: this.reduced,
      },
      L,
    )
    this.customer = new CustomerView(this, L, inv.equipped.glass)
    this.customer.setReducedMotion(this.reduced)
    this.floats = new FloatTexts(this)
    this.starsPop = new StarsPop(this)
    this.coins = new CoinBurst(this)
    this.debug = new DebugOverlay(this)
    this.debug.setVisible(new URLSearchParams(location.search).has('debug'))
    this.onBus('dev:overlay', (v) => this.debug.setVisible(v))
    this.onBus('game:pause', () => this.setPaused(true))
    this.onBus('game:resume', () => this.setPaused(false))
    this.onBus('app:interrupt', (on) => {
      if (on) this.setPaused(true)
    })
    this.onBus('settings:changed', () => {
      const s = useSettingsStore().data
      this.reduced = s.reducedMotion
      this.colorBlind = s.colorBlind
      this.customer.setReducedMotion(this.reduced)
      this.onSettingsChanged()
    })
    this.layoutPlay(L)
  }

  protected onSettingsChanged(): void {}

  protected setPaused(on: boolean): void {
    if (this.paused === on) return
    this.paused = on
    if (on) {
      this.station.setInputEnabled(false)
      AudioService.pourSilence()
      this.tweens.pauseAll()
      this.time.paused = true
    } else {
      this.tweens.resumeAll()
      this.time.paused = false
      this.station.setInputEnabled(this.inputAllowed())
    }
  }

  /** Alt sınıf: duraklatma bitince giriş açık olmalı mı. */
  protected inputAllowed(): boolean {
    return true
  }

  protected wait(ms: number): Promise<void> {
    const g = this.gen
    return new Promise((resolve) => {
      this.time.delayedCall(ms, () => {
        if (g === this.gen) resolve()
      })
    })
  }

  protected alive(g: number): boolean {
    return g === this.gen && this.sys.isActive()
  }

  /** Müşteri tepkisi: müşterinin balonunda replik ve emoji. */
  protected say(customer: CustomerId, bucket: LineBucket, rand?: () => number, overrideLine?: string): string {
    const line = overrideLine ?? pickLine(customer, bucket, rand)
    const tone = bucket === 'p95' || bucket === 'p85' ? 'good' : bucket === 'p70' || bucket === 'p50' ? 'neutral' : 'bad'
    this.customer.say(line, BUCKET_EMOJI[bucket], tone, 1900)
    AudioService.play('pop', { rate: 0.9 + Math.random() * 0.2 })
    return line
  }

  protected shakeCamera(): void {
    if (this.reduced) return
    this.cameras.main.shake(260, 0.006)
  }

  update(_t: number, deltaMs: number): void {
    if (this.paused) return
    const dt = Math.min(0.05, deltaMs / 1000)
    this.checkFps(deltaMs)
    this.station.update(dt)
    this.customer.update(dt)
    this.themeFx.update(dt)
    this.tick(dt)
    this.debug.update(dt, this, this.station, this.debugExtra())
  }

  /** İlk 5 sn'de ortalama FPS 50'nin altındaysa otomatik düşük kalite (DPR 1.5, yarı partikül). */
  private checkFps(deltaMs: number): void {
    if (this.fpsChecked || deltaMs > 250) return
    this.fpsT += deltaMs / 1000
    this.fpsFrames++
    if (this.fpsT < DEV.lowFpsWindow) return
    this.fpsChecked = true
    const fps = this.fpsFrames / this.fpsT
    if (fps < DEV.lowFpsThreshold) {
      useSettingsStore().update({ lowQuality: true })
      void saveNow()
    }
  }

  protected debugExtra(): string {
    return ''
  }

  protected abstract tick(dt: number): void

  protected layoutPlay(L: Layout): void {
    this.bg.layout(L)
    this.themeFx.layout(L)
    this.station.layout(L)
    this.customer.layout(L)
    this.debug.place(L.col.x + 10 * L.u, L.hud.y + L.hud.h + 10 * L.u, 22 * L.u)
  }

  protected onResize(L: Layout): void {
    this.layoutPlay(L)
  }

  protected onShutdown(): void {
    this.gen++
    AudioService.pourSilence()
    this.station?.destroy()
    this.customer?.destroy()
    this.floats?.destroy()
    this.starsPop?.destroy()
    this.coins?.destroy()
    this.debug?.destroy()
    this.themeFx?.destroy()
  }
}
