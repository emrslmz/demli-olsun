// Yer tutucu: doğru boyutta, adı üstünde yazan basit görsel.

const FOLDER_COLORS = {
  bg: '#6B8FB5', char: '#E0A96D', pot: '#9AA5B1', prop: '#E8DCC0', ui: '#5B7A5E', icon: '#C9A227',
  fx: '#FFFFFF', decal: '#1F4E8C', badge: '#B87333', logo: '#1E9AA8', deco: '#7FB3D5',
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export function placeholderSvg(a, palette) {
  const { w, h } = a
  const c = FOLDER_COLORS[a.folder] ?? palette.accent
  const fs = Math.max(10, Math.min(w, h) / 10)
  if (a.folder === 'bg') {
    const cy = h * (a.meta?.counterY ?? 0.68)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="${w}" height="${cy}" fill="${palette.primary}"/>
      <rect y="${cy}" width="${w}" height="${h - cy}" fill="${palette.dark}"/>
      <line x1="0" x2="${w}" y1="${cy}" y2="${cy}" stroke="#fff" stroke-width="6"/>
      <text x="${w / 2}" y="${h * 0.15}" fill="#fff" font-family="sans-serif" font-size="${fs * 0.6}" text-anchor="middle">${esc(a.id)}</text>
    </svg>`
  }
  if (a.bgColor) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><radialGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <rect width="${w}" height="${h}" fill="${a.bgColor}"/><circle cx="${w / 2}" cy="${h / 2}" r="${w * 0.4}" fill="url(#g)"/></svg>`
  }
  const m = Math.min(w, h) * 0.06
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}" rx="${m * 2}" fill="${c}" stroke="#3B2416" stroke-width="${m * 0.6}"/>
    <text x="${w / 2}" y="${h / 2}" fill="#3B2416" font-family="sans-serif" font-size="${fs * (a.id.length > 14 ? 0.7 : 1)}" text-anchor="middle" dominant-baseline="middle">${esc(a.id)}</text>
  </svg>`
}
