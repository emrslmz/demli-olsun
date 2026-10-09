/** Tema görsellerini Phaser texture'larına yükler. Texture anahtarı = görsel kimliği. */

import * as Phaser from 'phaser'
import { ThemeService } from '@/services/theme/ThemeService'

/** Açılışta yüklenmeyen, gerektiğinde yüklenen görseller (büyük ve isteğe bağlı olanlar). */
export function isLazyAsset(id: string): boolean {
  return id.startsWith('bg_') || id.startsWith('pot_')
}

export function bgId(venue: string, variant: 'phone' | 'tablet'): string {
  return `bg_${venue}_${variant}`
}

export function potIds(pot: string): { demlik: string; caydanlik: string } {
  return { demlik: `pot_demlik_${pot}`, caydanlik: `pot_caydanlik_${pot}` }
}

/** Yüklü olmayan görselleri yükler. Bulunamayan kimlikler sessizce atlanır. */
export function ensureTextures(scene: Phaser.Scene, ids: string[]): Promise<void> {
  const missing = ids.filter((id) => !scene.textures.exists(id) && ThemeService.resolve(id))
  if (missing.length === 0) return Promise.resolve()
  return new Promise((resolve) => {
    for (const id of missing) {
      const r = ThemeService.resolve(id)
      if (r) scene.load.image(id, r.url)
    }
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve())
    scene.load.start()
  })
}

/** Tema değişince tüm tema texture'larını kaldırır. */
export function clearThemeTextures(scene: Phaser.Scene): void {
  for (const id of ThemeService.allAssetIds()) {
    if (scene.textures.exists(id)) scene.textures.remove(id)
  }
}
