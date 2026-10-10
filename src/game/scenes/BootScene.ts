/**
 * Açılış sahnesi: fontları bekler, tema görsellerini yükler, kodla çizilen texture'ları üretir,
 * 'game:booted' yayınlar ve ortam sahnesine geçer. Tema değişiminde yeniden çalıştırılır.
 */

import * as Phaser from 'phaser'
import { bus } from '@/bus'
import { FONTS } from '@/config/theme'
import { ThemeService } from '@/services/theme/ThemeService'
import { useInventoryStore } from '@/stores/inventory'
import { bgId, clearThemeTextures, isLazyAsset, potIds } from '../assets'
import { generateCodeArt } from '../art/codeArt'
import { getLayout, runtime } from '../runtime'

export interface BootData {
  reload?: boolean
  /** Yeniden yüklemeden sonra başlatılacak sahne. */
  next?: string
  nextData?: object
}

async function waitFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  const loads = [`800 32px ${FONTS.chalk}`, `600 32px ${FONTS.ui}`]
  await Promise.race([Promise.all(loads.map((f) => document.fonts.load(f, 'çğıİöşüÇĞÖŞÜ'))), new Promise((r) => setTimeout(r, 2500))])
}

export class BootScene extends Phaser.Scene {
  private bootData: BootData = {}

  constructor() {
    super('Boot')
  }

  init(data: BootData) {
    this.bootData = data ?? {}
  }

  preload() {
    if (this.bootData.reload) clearThemeTextures(this)
    const inv = useInventoryStore()
    runtime.venue = inv.equipped.venue
    const L = getLayout()
    const pots = potIds(inv.equipped.pot)
    const eager = ThemeService.allAssetIds((id) => !isLazyAsset(id))
    eager.push(bgId(runtime.venue, L.bg.variant), pots.demlik, pots.caydanlik)
    for (const id of eager) {
      const r = ThemeService.resolve(id)
      if (r && !this.textures.exists(id)) this.load.image(id, r.url)
    }
  }

  async create() {
    await waitFonts()
    generateCodeArt(this)
    const next = this.bootData.next ?? 'Ambient'
    const wasReload = !!this.bootData.reload
    this.scene.start(next, this.bootData.nextData)
    if (!wasReload) bus.emit('game:booted')
  }
}
