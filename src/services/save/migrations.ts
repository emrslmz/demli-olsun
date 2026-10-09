/**
 * Kayıt migration'ları. Her adım bir sürümden bir sonrakine geçirir.
 * v0: prototip dönemindeki düz kayıt biçimi ({ coins, nickname, best, served, settings: { sound, vibration } }).
 */

import { defaultSave, SAVE_VERSION, type SaveData } from './schema'

type AnyRecord = Record<string, unknown>

const isRecord = (v: unknown): v is AnyRecord => typeof v === 'object' && v !== null && !Array.isArray(v)

export const MIGRATIONS: Record<number, (data: AnyRecord) => AnyRecord> = {
  0: (old) => {
    const base = defaultSave() as unknown as AnyRecord
    const s = isRecord(old.settings) ? old.settings : {}
    const settings = { ...(base.settings as AnyRecord) }
    if (typeof s.sound === 'boolean') {
      settings.sfx = s.sound
      settings.music = s.sound
    }
    if (typeof s.vibration === 'boolean') settings.haptics = s.vibration
    const player = { ...(base.player as AnyRecord) }
    if (typeof old.nickname === 'string') player.nickname = old.nickname
    const progress = { ...(base.progress as AnyRecord) }
    if (typeof old.best === 'number') progress.bestScore = old.best
    if (typeof old.served === 'number') progress.totalServed = old.served
    const flags = { ...(base.flags as AnyRecord) }
    if (typeof old.nickname === 'string' && old.nickname.length > 0) {
      flags.onboardingDone = true
      flags.tutorialDone = true
    }
    return {
      ...base,
      version: 1,
      tips: typeof old.coins === 'number' ? old.coins : base.tips,
      player,
      progress,
      settings,
      flags,
    }
  },
}

/** Eksik alanları varsayılanla doldurur; tipi uyuşmayanları varsayılana çeker; bilinmeyen alanları korur. */
export function deepMerge<T>(defaults: T, value: unknown): T {
  if (isRecord(defaults)) {
    if (!isRecord(value)) return defaults
    const out: AnyRecord = { ...value }
    for (const key of Object.keys(defaults)) {
      out[key] = deepMerge((defaults as AnyRecord)[key], value[key])
    }
    return out as T
  }
  if (value === undefined || value === null) return defaults
  if (Array.isArray(defaults)) return (Array.isArray(value) ? value : defaults) as T
  if (defaults === null || typeof defaults === typeof value) return value as T
  return defaults
}

export class SaveMigrationError extends Error {}

export function migrate(raw: unknown): SaveData {
  if (!isRecord(raw)) throw new SaveMigrationError('Kayıt bir nesne değil')
  let data: AnyRecord = raw
  let version = typeof data.version === 'number' ? data.version : 0
  if (version > SAVE_VERSION) throw new SaveMigrationError(`Kayıt sürümü daha yeni: ${version}`)
  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version]
    if (!step) throw new SaveMigrationError(`Migration yok: v${version}`)
    data = step(data)
    version = typeof data.version === 'number' ? data.version : version + 1
  }
  return deepMerge(defaultSave(), data)
}
