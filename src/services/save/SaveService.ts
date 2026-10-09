/**
 * Kayıt servisi: @capacitor/preferences üzerinde tek bir JSON tutar.
 * Kayıt bozuksa uygulama çökmez: yedekten ya da varsayılandan başlar ve olayı loglar.
 */

import { defaultSave, type SaveData } from './schema'
import { migrate } from './migrations'

export interface KeyValueStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

export const SAVE_KEY = 'demli-olsun.save'
export const BACKUP_KEY = 'demli-olsun.save.bak'

export class MemoryStore implements KeyValueStore {
  readonly map = new Map<string, string>()
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null
  }
  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value)
  }
  async remove(key: string): Promise<void> {
    this.map.delete(key)
  }
}

export class PreferencesStore implements KeyValueStore {
  // Not: Capacitor eklenti vekilini (proxy) async fonksiyondan döndürmek "then()" aramasına yol açar;
  // bu yüzden modül nesnesi saklanır.
  private mod: typeof import('@capacitor/preferences') | null = null
  private async m() {
    if (!this.mod) this.mod = await import('@capacitor/preferences')
    return this.mod
  }
  async get(key: string): Promise<string | null> {
    return (await (await this.m()).Preferences.get({ key })).value
  }
  async set(key: string, value: string): Promise<void> {
    await (await this.m()).Preferences.set({ key, value })
  }
  async remove(key: string): Promise<void> {
    await (await this.m()).Preferences.remove({ key })
  }
}

export type SaveLoadSource = 'main' | 'backup' | 'default'

export interface SaveLoadResult {
  data: SaveData
  source: SaveLoadSource
  /** Ana kayıt okunamadıysa nedeni. */
  error?: string
}

export class SaveService {
  private writing: Promise<void> = Promise.resolve()
  private lastGood: string | null = null
  constructor(
    private readonly store: KeyValueStore,
    private readonly log: (msg: string, err?: unknown) => void = (m, e) => console.warn(`[save] ${m}`, e ?? ''),
  ) {}

  private parse(raw: string | null): SaveData | null {
    if (!raw) return null
    return migrate(JSON.parse(raw))
  }

  async load(): Promise<SaveLoadResult> {
    let mainRaw: string | null = null
    try {
      mainRaw = await this.store.get(SAVE_KEY)
      const data = this.parse(mainRaw)
      if (data) {
        this.lastGood = mainRaw
        return { data, source: 'main' }
      }
      if (mainRaw === null) {
        // İlk açılış.
        return { data: defaultSave(), source: 'default' }
      }
    } catch (err) {
      this.log('Ana kayıt okunamadı, yedeğe geçiliyor', err)
      try {
        const backup = this.parse(await this.store.get(BACKUP_KEY))
        if (backup) return { data: backup, source: 'backup', error: String(err) }
      } catch (err2) {
        this.log('Yedek kayıt da okunamadı, varsayılandan başlanıyor', err2)
      }
      return { data: defaultSave(), source: 'default', error: String(err) }
    }
    return { data: defaultSave(), source: 'default' }
  }

  /** Kayıtları sıraya koyar; aynı anda iki yazma çakışmaz. */
  save(data: SaveData): Promise<void> {
    const json = JSON.stringify(data)
    this.writing = this.writing
      .then(async () => {
        if (this.lastGood && this.lastGood !== json) await this.store.set(BACKUP_KEY, this.lastGood)
        await this.store.set(SAVE_KEY, json)
        this.lastGood = json
      })
      .catch((err) => this.log('Kayıt yazılamadı', err))
    return this.writing
  }

  async reset(): Promise<SaveData> {
    await this.writing
    await this.store.remove(SAVE_KEY)
    await this.store.remove(BACKUP_KEY)
    this.lastGood = null
    return defaultSave()
  }
}
