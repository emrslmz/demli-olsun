// Görsel kataloğu: görsel üretim dokümanındaki adlar, boyutlar ve klasörler.
// Her tema yalnızca default'tan farklı olanları ve kendine özel ekstraları içerir.

export const THEMES = ['default', 'kis', 'yaz', 'halloween']

export const PALETTES = {
  default: { primary: '#1F4E8C', accent: '#1E9AA8', warm: '#8B1E0F', metal: '#C9A227', dark: '#3B2416', light: '#EDEDE4' },
  kis: { primary: '#2F5D50', accent: '#CFE8F5', warm: '#E07A2F', metal: '#C9A227', dark: '#3B2416', light: '#F7FAFC' },
  yaz: { primary: '#1FA3B8', accent: '#F6C445', warm: '#F2735B', metal: '#C9A227', dark: '#3B2416', light: '#FFF8E7' },
  halloween: { primary: '#3A2459', accent: '#F07C1E', warm: '#7BC043', metal: '#C9A227', dark: '#2A1A12', light: '#EDE6D6' },
}

export const CUSTOMERS = ['riza', 'muhtar', 'taksici', 'ogrenci', 'esnaf']
export const EXPRESSIONS = ['neutral', 'happy', 'angry']
export const POT_MATERIALS = ['celik', 'emaye', 'porselen', 'bakir']
export const VENUES = ['mahalle', 'sahil', 'rize', 'bogaz']

export const ICONS = [
  'icon_coin', 'icon_life', 'icon_life_broken', 'icon_sugar', 'icon_star', 'icon_star_empty', 'icon_fire',
  'icon_gift', 'icon_lock', 'icon_ad', 'icon_trophy', 'icon_share', 'icon_pause', 'icon_settings', 'icon_shop',
  'icon_music', 'icon_sfx', 'icon_vibration', 'icon_back', 'icon_close', 'icon_clock', 'icon_dem', 'icon_water',
  'icon_serve', 'icon_info',
]

export const DECALS = ['decal_yaldiz', 'decal_lale', 'decal_nazar', 'decal_kristal', 'decal_baslangic']
export const BADGES = ['badge_mahalle', 'badge_ilce', 'badge_sehir', 'badge_bolge', 'badge_turkiye']

/** Temada kıyafet/aksesuarı değişen müşteriler (characters.mjs → themeAccessory ile aynı). */
const THEME_CHARS = {
  default: CUSTOMERS,
  kis: CUSTOMERS,
  yaz: ['muhtar', 'esnaf', 'taksici'],
  halloween: ['ogrenci', 'esnaf', 'muhtar'],
}

const THEME_PARTICLE = { kis: 'fx_snowflake', yaz: 'fx_sun_glint', halloween: 'fx_bat' }

/**
 * @typedef {{ id: string, folder: string, w: number, h: number, fmt: 'png'|'jpg', bgColor?: string,
 *   meta?: Record<string, unknown>, extra?: 'deco'|'particles' }} AssetDef
 */

/** @returns {AssetDef[]} */
export function catalog(theme) {
  /** @type {AssetDef[]} */
  const list = []
  const add = (a) => list.push({ fmt: 'png', ...a })
  const isDefault = theme === 'default'

  // Arka planlar
  for (const v of isDefault ? VENUES : ['mahalle']) {
    add({ id: `bg_${v}_phone`, folder: 'bg', w: 1080, h: 2340, fmt: 'jpg', meta: { counterY: 0.5 } })
    add({ id: `bg_${v}_tablet`, folder: 'bg', w: 1536, h: 2048, fmt: 'jpg', meta: { counterY: 0.5 } })
  }
  // Müşteriler (temada yalnızca aksesuarı değişenler; diğerleri default'tan gelir)
  for (const c of THEME_CHARS[theme] ?? CUSTOMERS) for (const e of EXPRESSIONS) add({ id: `char_${c}_${e}`, folder: 'char', w: 640, h: 640 })
  // Logo
  add({ id: 'logo_emblem', folder: 'logo', w: 1024, h: 1024 })

  if (isDefault) {
    for (const m of POT_MATERIALS) {
      add({ id: `pot_demlik_${m}`, folder: 'pot', w: 768, h: 620 })
      add({ id: `pot_caydanlik_${m}`, folder: 'pot', w: 768, h: 768 })
    }
    add({ id: 'prop_tabak', folder: 'prop', w: 512, h: 512 })
    add({ id: 'prop_sekerlik', folder: 'prop', w: 512, h: 512 })
    add({ id: 'prop_seker', folder: 'prop', w: 128, h: 128 })
    add({ id: 'prop_kasik', folder: 'prop', w: 256, h: 256 })
    add({ id: 'prop_tepsi', folder: 'prop', w: 768, h: 768 })
    add({ id: 'prop_tezgah_ust', folder: 'prop', w: 1080, h: 560, fmt: 'jpg' })
    add({ id: 'prop_tezgah_on', folder: 'prop', w: 1080, h: 720, fmt: 'jpg' })
    for (const id of ICONS) add({ id, folder: 'icon', w: 256, h: 256 })
    add({ id: 'fx_steam', folder: 'fx', w: 256, h: 256, bgColor: '#000000', meta: { blend: 'add' } })
    add({ id: 'fx_sparkle', folder: 'fx', w: 128, h: 128, bgColor: '#000000', meta: { blend: 'add' } })
    for (const id of DECALS) add({ id, folder: 'decal', w: 512, h: 512 })
    for (const id of BADGES) add({ id, folder: 'badge', w: 512, h: 512 })
  } else {
    add({ id: 'deco_counter', folder: 'deco', w: 512, h: 512, extra: 'deco' })
    const p = THEME_PARTICLE[theme]
    if (p === 'fx_sun_glint') {
      add({ id: p, folder: 'fx', w: 128, h: 128, bgColor: '#000000', meta: { blend: 'add' }, extra: 'particles' })
    } else {
      add({ id: p, folder: 'fx', w: 128, h: 128, extra: 'particles' })
    }
  }
  return list
}
