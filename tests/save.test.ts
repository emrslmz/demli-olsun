import { describe, expect, it } from 'vitest'
import { deepMerge, migrate } from '@/services/save/migrations'
import { BACKUP_KEY, MemoryStore, SAVE_KEY, SaveService } from '@/services/save/SaveService'
import { defaultSave, SAVE_VERSION } from '@/services/save/schema'

const quiet = () => {}

describe('kayıt migration', () => {
  it('v0 prototip kaydını güncel şemaya taşır', () => {
    const v0 = { coins: 420, nickname: 'Çaycı42', best: 9100, served: 77, settings: { sound: false, vibration: false } }
    const d = migrate(v0)
    expect(d.version).toBe(SAVE_VERSION)
    expect(d.tips).toBe(420)
    expect(d.player.nickname).toBe('Çaycı42')
    expect(d.progress.bestScore).toBe(9100)
    expect(d.progress.totalServed).toBe(77)
    expect(d.settings.sfx).toBe(false)
    expect(d.settings.music).toBe(false)
    expect(d.settings.haptics).toBe(false)
    expect(d.flags.onboardingDone).toBe(true)
    expect(d.inventory.equipped.glass).toBe('klasik')
  })

  it('eksik alanları varsayılanla doldurur, bilinmeyenleri korur', () => {
    const partial = { version: SAVE_VERSION, tips: 5, settings: { music: false }, extra: { keep: 1 } }
    const d = migrate(partial) as ReturnType<typeof migrate> & { extra?: unknown }
    expect(d.tips).toBe(5)
    expect(d.settings.music).toBe(false)
    expect(d.settings.sfx).toBe(true)
    expect(d.daily.history).toEqual([])
    expect(d.extra).toEqual({ keep: 1 })
  })

  it('tipi bozuk alanları varsayılana çeker', () => {
    const d = deepMerge(defaultSave(), { tips: 'çok', settings: { musicVolume: 'yüksek' } })
    expect(d.tips).toBe(100)
    expect(d.settings.musicVolume).toBe(0.6)
  })

  it('daha yeni sürümü reddeder', () => {
    expect(() => migrate({ version: SAVE_VERSION + 1 })).toThrow()
  })
})

describe('SaveService', () => {
  it('kaydeder ve geri yükler', async () => {
    const store = new MemoryStore()
    const s = new SaveService(store, quiet)
    const d = defaultSave()
    d.tips = 1234
    await s.save(d)
    const r = await new SaveService(store, quiet).load()
    expect(r.source).toBe('main')
    expect(r.data.tips).toBe(1234)
  })

  it('bozuk kayıtta yedekten başlar, çökmez', async () => {
    const store = new MemoryStore()
    const s = new SaveService(store, quiet)
    const a = defaultSave()
    a.tips = 10
    await s.save(a)
    const b = defaultSave()
    b.tips = 20
    await s.save(b)
    await store.set(SAVE_KEY, '{bozuk json')
    const r = await new SaveService(store, quiet).load()
    expect(r.source).toBe('backup')
    expect(r.data.tips).toBe(10)
  })

  it('ana kayıt ve yedek bozuksa varsayılandan başlar', async () => {
    const store = new MemoryStore()
    await store.set(SAVE_KEY, 'xx')
    await store.set(BACKUP_KEY, 'yy')
    const r = await new SaveService(store, quiet).load()
    expect(r.source).toBe('default')
    expect(r.data.tips).toBe(100)
  })

  it('ilk açılışta varsayılan döner', async () => {
    const r = await new SaveService(new MemoryStore(), quiet).load()
    expect(r.source).toBe('default')
    expect(r.error).toBeUndefined()
  })
})
