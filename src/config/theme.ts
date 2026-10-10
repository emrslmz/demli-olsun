/** Renk tokenları, fontlar ve tema takvimi. */

export type ThemeId = 'default' | 'kis' | 'yaz' | 'halloween'
export type ThemeSetting = 'auto' | ThemeId

export const THEME_IDS: ThemeId[] = ['default', 'kis', 'yaz', 'halloween']

function parseThemeSetting(v: string | undefined): ThemeSetting {
  return v === 'default' || v === 'kis' || v === 'yaz' || v === 'halloween' ? v : 'auto'
}

/** Aktif tema. `auto` modunda Europe/Istanbul takvimine göre seçilir. */
export const ACTIVE_THEME: ThemeSetting = parseThemeSetting(import.meta.env.VITE_ACTIVE_THEME)

export interface Palette {
  primary: string
  accent: string
  warm: string
  metal: string
  dark: string
  light: string
}

/** Temel palet (Bölüm 13). Tema manifest'i yüklenemezse bu kullanılır. */
export const BASE_PALETTE: Palette = {
  primary: '#1F4E8C',
  accent: '#1E9AA8',
  warm: '#8B1E0F',
  metal: '#C9A227',
  dark: '#3B2416',
  light: '#EDEDE4',
}

/** Temadan bağımsız sabit renkler. */
export const FIXED_COLORS = {
  chalkboard: '#1E2B24',
  chalk: '#EDEDE4',
  paper: '#F3E6C8',
  ink: '#3B2416',
  good: '#4E9A3A',
  bad: '#C0392B',
  coin: '#E2B33C',
}

export const FONTS = {
  /** Başlıklar ve oyun içi büyük yazılar: yuvarlak, kalın cartoon. */
  chalk: '"Baloo 2", sans-serif',
  /** Arayüz. */
  ui: '"Baloo 2", sans-serif',
}

/**
 * Europe/Istanbul tarihine göre otomatik tema.
 * 1 Aralık–28/29 Şubat kış, 1 Haziran–31 Ağustos yaz, 20 Ekim–2 Kasım halloween, kalan günler default.
 */
export function themeForIstanbulDate(month: number, day: number): ThemeId {
  if (month === 12 || month === 1 || month === 2) return 'kis'
  if (month >= 6 && month <= 8) return 'yaz'
  if ((month === 10 && day >= 20) || (month === 11 && day <= 2)) return 'halloween'
  return 'default'
}

export function istanbulMonthDay(date: Date): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? '1')
  const day = Number(parts.find((p) => p.type === 'day')?.value ?? '1')
  return { month, day }
}

export function resolveThemeSetting(setting: ThemeSetting, now: Date = new Date()): ThemeId {
  if (setting !== 'auto') return setting
  const { month, day } = istanbulMonthDay(now)
  return themeForIstanbulDate(month, day)
}
