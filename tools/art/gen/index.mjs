// Görsel üretici kayıt defteri. Bir kimlik için çizim yoksa null döner (yer tutucu kullanılır).

const generators = []

/** @param {(a: any, ctx: any) => any} fn  @param {(id: string) => boolean} match */
export function register(match, fn) {
  generators.push({ match, fn })
}

let loaded = false
async function loadAll() {
  if (loaded) return
  loaded = true
  const mods = ['characters', 'pots', 'props', 'ui', 'icons', 'fx', 'decals', 'badges', 'logo', 'backgrounds', 'deco']
  for (const m of mods) {
    try {
      await import(`./${m}.mjs`)
    } catch (err) {
      if (err?.code !== 'ERR_MODULE_NOT_FOUND') throw err
    }
  }
}

export async function generate(a, ctx) {
  await loadAll()
  for (const g of generators) if (g.match(a.id, ctx)) return g.fn(a, ctx)
  return null
}
