import * as Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { AmbientScene } from './scenes/AmbientScene'
import { ShiftScene } from './scenes/ShiftScene'
import { DailyScene } from './scenes/DailyScene'
import { TutorialScene } from './scenes/TutorialScene'

/**
 * Ölçekleme: Scale.NONE + elle resize. Kanvas css × DPR piksel, zoom = 1/DPR.
 * (RESIZE modu DPR'yi hesaba katmadığından yüksek DPR'de bulanık çizer.) Ayrıntı: PLAN.md.
 */
export function makeConfig(parent: HTMLElement, w: number, h: number, dpr: number): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.WEBGL,
    parent,
    width: Math.round(w * dpr),
    height: Math.round(h * dpr),
    backgroundColor: '#1a120c',
    scale: {
      mode: Phaser.Scale.NONE,
      zoom: 1 / dpr,
    },
    audio: { noAudio: true },
    render: {
      antialias: true,
      powerPreference: 'high-performance',
      roundPixels: false,
      transparent: false,
    },
    input: { activePointers: 4 },
    fps: { target: 60, smoothStep: true },
    disableContextMenu: true,
    banner: false,
    scene: [BootScene, AmbientScene, ShiftScene, DailyScene, TutorialScene],
  }
}
