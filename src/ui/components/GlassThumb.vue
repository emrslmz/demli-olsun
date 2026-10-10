<script setup lang="ts">
/**
 * Çarşı kartı için küçük bardak çizimi. Şekil oyundaki bardağın profilinden (glassModel) üretilir, stil oyundakiyle
 * aynıdır: düz renkler, kalın kontur, sağda gölge bandı, solda beyaz parlama şeritleri. Cam rengi, ağız rengi ve
 * desen skin'den gelir. Temada kullanıcı bardak görselleri (bardak_on / bardak_ic) varsa onlar katmanlanır.
 */
import { computed } from 'vue'
import { getGlassModel } from '@/core/glassModel'
import { glassSkin } from '@/data/cosmetics'
import { ThemeService } from '@/services/theme/ThemeService'

const props = defineProps<{ id: string }>()
const skin = computed(() => glassSkin(props.id))
const decal = computed(() => (skin.value.decal ? ThemeService.url(skin.value.decal) : ''))
/** Kullanıcı bardak görselleri (src/game/art/glassArt.ts → CUSTOM_GLASS ile aynı adlar). */
const custom = computed(() => {
  const skinFront = ThemeService.url(`bardak_on_${props.id}`)
  const front = skinFront || ThemeService.url('bardak_on')
  const mask = ThemeService.url('bardak_ic')
  if (!front || !mask) return null
  const back = ThemeService.url(`bardak_arka_${props.id}`) || ThemeService.url('bardak_arka')
  const maskCss = `url("${mask}") center / contain no-repeat`
  return { front, back, mask: maskCss, decal: skinFront ? '' : decal.value }
})
const uid = `gt${Math.random().toString(36).slice(2, 8)}`

const K = 0.26
const FILL = 0.84
const TEA = '#C2401A'
const TEA_DARK = '#8C2A10'
const TEA_TOP = '#E0793D'
const W = 100
const H = 132
const model = getGlassModel('ince')
const def = model.def
// İç yükseklik: ağız elipsi + dip + taban elipsi kutuya sığsın.
const ih = 92
const cx = W / 2
const yTop = 10
const yBot = yTop + ih
const by = yBot + def.base * ih
const wall = def.wall * ih
const r = (t: number) => model.radiusAt(Math.max(0, Math.min(1, t))) * ih
const y = (t: number) => yBot - t * ih
const rTop = r(1) + wall
const r0 = r(0) + wall
const rBase = r0 * 1.1
const n = (v: number) => Math.round(v * 10) / 10

function side(rel: number, t0: number, t1: number, steps = 24, extra = 0): string[] {
  const out: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps
    out.push(`${n(cx + (r(t) + extra) * rel)} ${n(y(t))}`)
  }
  return out
}

const outer = (() => {
  let d = `M${n(cx - rTop)} ${n(yTop)} A${n(rTop)} ${n(rTop * K)} 0 0 1 ${n(cx + rTop)} ${n(yTop)}`
  d += ' L' + side(1, 1, 0, 30, wall).join(' L')
  d += ` Q${n(cx + r0 + wall * 0.6)} ${n(by - (by - yBot) * 0.3)} ${n(cx + rBase)} ${n(by)}`
  d += ` A${n(rBase)} ${n(rBase * K)} 0 0 1 ${n(cx - rBase)} ${n(by)}`
  d += ` Q${n(cx - r0 - wall * 0.6)} ${n(by - (by - yBot) * 0.3)} ${n(cx - r0)} ${n(yBot)}`
  d += ' L' + side(-1, 0, 1, 30, wall).join(' L')
  return d + 'Z'
})()

const liquid = (() => {
  const rl = r(FILL)
  const rb = r(0)
  let d = `M${n(cx - rl)} ${n(y(FILL))} A${n(rl)} ${n(rl * K)} 0 0 1 ${n(cx + rl)} ${n(y(FILL))}`
  d += ' L' + side(1, FILL, 0).join(' L')
  d += ` A${n(rb)} ${n(rb * K)} 0 0 1 ${n(cx - rb)} ${n(yBot)}`
  d += ' L' + side(-1, 0, FILL).join(' L')
  return d + 'Z'
})()

function band(rel0: number, rel1: number, t0: number, t1: number): string {
  const a = side(rel0, t0, t1, 24, wall)
  const b = side(rel1, t1, t0, 24, wall)
  return `M${a.join(' L')} L${b.join(' L')}Z`
}

function stripe(rel: number, t0: number, t1: number): string {
  return 'M' + side(rel, t0, t1, 16, wall * 0.5).join(' L')
}

const surface = { cx, cy: y(FILL), rx: r(FILL), ry: r(FILL) * K }
const rim = { rx: rTop, ry: rTop * K, lip: rTop - wall * 0.5 }
const base = `M${n(cx - r0)} ${n(yBot)} A${n(r0)} ${n(r0 * K)} 0 0 0 ${n(cx + r0)} ${n(yBot)} L${n(cx + rBase)} ${n(by)} A${n(rBase)} ${n(rBase * K)} 0 0 1 ${n(cx - rBase)} ${n(by)}Z`
const sw = 3.2
</script>

<template>
  <div v-if="custom" class="gt gt--img" aria-hidden="true">
    <img v-if="custom.back" :src="custom.back" alt="" />
    <div class="gt__tea" :style="{ mask: custom.mask, WebkitMask: custom.mask }">
      <img v-if="custom.decal" class="gt__decal" :src="custom.decal" alt="" />
    </div>
    <img :src="custom.front" alt="" />
  </div>
  <svg v-else class="gt" :viewBox="`0 0 ${W} ${H}`" aria-hidden="true">
    <defs>
      <clipPath :id="`${uid}o`"><path :d="outer" /></clipPath>
      <clipPath :id="`${uid}l`"><path :d="liquid" /></clipPath>
    </defs>
    <ellipse :cx="cx" :cy="by + 2" :rx="rBase * 1.5" :ry="rBase * 0.36" fill="rgba(42,20,8,.25)" />
    <path :d="outer" :fill="skin.glass" fill-opacity=".62" />
    <path
      :d="`M${cx - rTop + wall} ${yTop} A${rTop - wall} ${(rTop - wall) * K} 0 0 1 ${cx + rTop - wall} ${yTop}`"
      fill="none"
      :stroke="skin.outline"
      stroke-width="1.6"
      stroke-opacity=".5"
    />
    <g :clip-path="`url(#${uid}o)`">
      <path :d="liquid" :fill="TEA" />
      <g :clip-path="`url(#${uid}l)`">
        <path :d="band(0.42, 1.3, -0.1, 1.05)" :fill="TEA_DARK" />
      </g>
      <ellipse :cx="surface.cx" :cy="surface.cy" :rx="surface.rx" :ry="surface.ry" :fill="TEA_TOP" stroke="#6E200C" stroke-width="1.4" />
      <ellipse :cx="cx - surface.rx * 0.38" :cy="surface.cy" :rx="surface.rx * 0.26" :ry="surface.ry * 0.34" fill="#fff" opacity=".55" />
      <path :d="base" :fill="skin.glass" />
      <image
        v-if="decal"
        :href="decal"
        :x="cx - r(0.3) * 1.1"
        :y="y(0.62)"
        :width="r(0.3) * 2.2"
        :height="y(0) - y(0.62)"
        opacity=".95"
        preserveAspectRatio="xMidYMid slice"
      />
      <path :d="band(0.62, 1.3, -0.2, 1.05)" fill="#1D4A5C" opacity=".14" />
      <path :d="stripe(-0.66, 0.34, 0.9)" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".95" />
      <path :d="stripe(-0.7, 0.1, 0.22)" stroke="#fff" stroke-width="5.5" fill="none" stroke-linecap="round" opacity=".9" />
      <path :d="stripe(0.74, 0.66, 0.86)" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85" />
    </g>
    <path :d="outer" fill="none" :stroke="skin.outline" :stroke-width="sw" stroke-linejoin="round" />
    <path
      :d="`M${cx - rim.lip} ${yTop} A${rim.lip} ${rim.lip * K} 0 0 0 ${cx + rim.lip} ${yTop}`"
      fill="none"
      :stroke="skin.rim"
      :stroke-width="sw * 1.2"
    />
    <ellipse :cx="cx" :cy="yTop" :rx="rim.rx" :ry="rim.ry" fill="none" :stroke="skin.outline" :stroke-width="sw * 0.9" />
    <ellipse :cx="cx - rim.rx * 0.5" :cy="yTop + rim.ry * 0.62" :rx="rim.rx * 0.16" :ry="rim.ry * 0.26" fill="#fff" />
  </svg>
</template>

<style scoped>
.gt {
  width: 100%;
  height: 100%;
  display: block;
}
.gt--img {
  position: relative;
}
.gt--img > img,
.gt__tea {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
/* Çay: maskenin üst ~%16'sı boş kalır (dolu bardak görünümü). */
.gt__tea {
  background: #c2401a;
  clip-path: inset(16% 0 0 0);
}
.gt__decal {
  position: absolute;
  left: 30%;
  top: 46%;
  width: 40%;
  height: 34%;
  object-fit: contain;
  opacity: 0.95;
}
</style>
