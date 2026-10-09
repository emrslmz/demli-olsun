/** Sahnelerin ortak tabanı: yerleşim, yeniden boyutlandırma, tema değişimi ve temizlik. */

import * as Phaser from 'phaser'
import { bus, type Events } from '@/bus'
import { RESIZE_EVENT } from '../createGame'
import { getLayout } from '../runtime'
import type { Layout } from '../layout'

type Handler<K extends keyof Events> = (e: Events[K]) => void

export abstract class BaseScene extends Phaser.Scene {
  private busOffs: (() => void)[] = []

  get L(): Layout {
    return getLayout()
  }

  /** Bus dinleyicisi ekler; sahne kapanınca otomatik kaldırılır. */
  protected onBus<K extends keyof Events>(type: K, fn: Handler<K>): void {
    bus.on(type, fn as never)
    this.busOffs.push(() => bus.off(type, fn as never))
  }

  /** Alt sınıflar create() başında çağırır. */
  protected setupBase(): void {
    this.busOffs = []
    const onResize = () => this.onResize(getLayout())
    this.game.events.on(RESIZE_EVENT, onResize)
    this.onBus('theme:changed', () => this.reloadTheme())
    this.onBus('game:start', (opts) => {
      const key = opts.mode === 'shift' ? 'Shift' : opts.mode === 'daily' ? 'Daily' : 'Tutorial'
      this.scene.start(key, opts)
    })
    this.onBus('game:quit', () => {
      if (this.scene.key !== 'Ambient') this.scene.start('Ambient')
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(RESIZE_EVENT, onResize)
      for (const off of this.busOffs) off()
      this.busOffs = []
      this.tweens.killAll()
      this.time.removeAllEvents()
      this.onShutdown()
    })
  }

  /** Tema değişince görselleri yeniden yükleyip bu sahneye geri döner. */
  protected reloadTheme(): void {
    this.scene.start('Boot', { reload: true, next: 'Ambient' })
  }

  protected abstract onResize(L: Layout): void

  protected onShutdown(): void {}
}
