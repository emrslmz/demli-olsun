/** Phaser.Game oluşturma ve boyut yönetimi. Bu modül dinamik import ile ayrı chunk'a alınır. */

import * as Phaser from 'phaser'
import { makeConfig } from './phaserConfig'
import { recomputeLayout, runtime, targetDpr } from './runtime'
import type { Insets } from '@/services/platform/safeArea'

export interface GameHandle {
  resize(cssW: number, cssH: number, safe: Insets): void
  setFpsLimit(fps: number): void
  setLowQuality(on: boolean): void
  destroy(): void
  game: Phaser.Game
}

export const RESIZE_EVENT = 'layout-resize'

export function createGame(parent: HTMLElement, cssW: number, cssH: number, safe: Insets): GameHandle {
  runtime.cssW = cssW
  runtime.cssH = cssH
  runtime.safe = { ...safe }
  runtime.dpr = targetDpr()
  recomputeLayout()
  const game = new Phaser.Game(makeConfig(parent, cssW, cssH, runtime.dpr))
  // Geliştirmede test betikleri sahne durumunu okuyabilsin.
  if (import.meta.env.DEV) (window as unknown as { __game?: Phaser.Game }).__game = game

  const applySize = () => {
    const dpr = targetDpr()
    runtime.dpr = dpr
    const W = Math.round(runtime.cssW * dpr)
    const H = Math.round(runtime.cssH * dpr)
    game.scale.setZoom(1 / dpr)
    game.scale.resize(W, H)
    const c = game.canvas
    if (c) {
      c.style.width = `${runtime.cssW}px`
      c.style.height = `${runtime.cssH}px`
    }
    recomputeLayout()
    game.events.emit(RESIZE_EVENT)
  }

  game.events.once(Phaser.Core.Events.READY, () => {
    const c = game.canvas
    c.style.width = `${cssW}px`
    c.style.height = `${cssH}px`
  })

  return {
    game,
    resize(w, h, s) {
      if (w <= 0 || h <= 0) return
      const same =
        w === runtime.cssW &&
        h === runtime.cssH &&
        s.top === runtime.safe.top &&
        s.bottom === runtime.safe.bottom &&
        s.left === runtime.safe.left &&
        s.right === runtime.safe.right &&
        runtime.dpr === targetDpr()
      runtime.cssW = w
      runtime.cssH = h
      runtime.safe = { ...s }
      if (!same) applySize()
    },
    setFpsLimit(fps) {
      game.loop.setFPSLimit(fps)
    },
    setLowQuality(on) {
      if (runtime.lowQuality === on) return
      runtime.lowQuality = on
      applySize()
    },
    destroy() {
      game.destroy(true)
    },
  }
}
