/**
 * Kullanıcının çizdiği bardak maskesinden (bardak_ic.png: çayın kaplayabileceği iç alan, opak; dışı şeffaf)
 * bardak iç profilini çıkarır. Böylece kendi bardak görselin oyunda doldurulurken seviye, görünen şekille birebir tutar.
 *
 * Maske önden ~15° yukarıdan bakışla çizilir: ağız ve dip birer elips (yükseklik ≈ genişlik × k).
 * Ağız elipsinin merkezi h = 1, dip elipsinin merkezi h = 0 kabul edilir.
 */

export interface MaskRows {
  /** Satır başına en sol / en sağ opak piksel; satır boşsa -1. */
  left: Int32Array
  right: Int32Array
}

export interface MaskProfile {
  /** Bardak ekseni (px). */
  cx: number
  /** Ağız elipsi merkezi ve dip elipsi merkezi (px). */
  yTop: number
  yBot: number
  /** İç profil [h, r]: r iç yükseklik (yBot − yTop) birimiyle. */
  profile: [number, number][]
}

/** RGBA piksel verisinden satır sınırları. */
export function rowsFromAlpha(data: Uint8ClampedArray, w: number, h: number, threshold = 128): MaskRows {
  const left = new Int32Array(h).fill(-1)
  const right = new Int32Array(h).fill(-1)
  for (let y = 0; y < h; y++) {
    const row = y * w * 4
    for (let x = 0; x < w; x++) {
      if ((data[row + x * 4 + 3] as number) >= threshold) {
        left[y] = x
        break
      }
    }
    if (left[y] === -1) continue
    for (let x = w - 1; x >= 0; x--) {
      if ((data[row + x * 4 + 3] as number) >= threshold) {
        right[y] = x
        break
      }
    }
  }
  return { left, right }
}

/** Satır sınırlarından profil. Maske çok küçük ya da boşsa null. */
export function profileFromRows(rows: MaskRows, k = 0.26, samples = 24): MaskProfile | null {
  const n = rows.left.length
  let y0 = -1
  let y1 = -1
  for (let y = 0; y < n; y++) {
    if ((rows.left[y] as number) >= 0) {
      if (y0 < 0) y0 = y
      y1 = y
    }
  }
  if (y0 < 0 || y1 - y0 < 12) return null
  const half = (y: number): number => {
    const i = Math.max(y0, Math.min(y1, Math.round(y)))
    const l = rows.left[i] as number
    const r = rows.right[i] as number
    return l < 0 ? 0 : (r - l + 1) / 2
  }
  // Ağız: üst bölgedeki en geniş satır elipsin merkezidir.
  const span = y1 - y0
  let rTop = 0
  for (let y = y0; y <= y0 + Math.max(2, span * 0.15); y++) rTop = Math.max(rTop, half(y))
  const yTop = y0 + rTop * k
  // Dip: elipsin merkezi alt kenardan r0·k yukarıda; r0 o satırın yarı genişliği (birkaç adımda yakınsar).
  let r0 = half(y1 - 1)
  for (let i = 0; i < 4; i++) r0 = half(y1 - r0 * k)
  const yBot = y1 - r0 * k
  const hpx = yBot - yTop
  if (hpx < 10) return null
  let sum = 0
  let cnt = 0
  for (let y = Math.ceil(yTop); y <= Math.floor(yBot); y++) {
    const l = rows.left[y] as number
    if (l < 0) continue
    sum += (l + (rows.right[y] as number)) / 2
    cnt++
  }
  const profile: [number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const h = i / samples
    profile.push([h, Math.max(0.01, half(yBot - h * hpx) / hpx)])
  }
  return { cx: cnt > 0 ? sum / cnt + 0.5 : 0, yTop, yBot, profile }
}

/** Görselin en alttaki opak satırı (bardağın oturduğu y); boşsa -1. */
export function lowestOpaqueRow(data: Uint8ClampedArray, w: number, h: number, threshold = 32): number {
  for (let y = h - 1; y >= 0; y--) {
    const row = y * w * 4
    for (let x = 0; x < w; x++) if ((data[row + x * 4 + 3] as number) >= threshold) return y
  }
  return -1
}
