/**
 * Safe area: CSS env(safe-area-inset-*) değerlerini bir ölçüm elemanıyla okur.
 * Aynı değerler Phaser'daki layout.ts'e aktarılır (CSS piksel).
 */

import { reactive } from 'vue'

export interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

export const safeArea = reactive<Insets>({ top: 0, right: 0, bottom: 0, left: 0 })

let probe: HTMLDivElement | null = null
const listeners = new Set<(i: Insets) => void>()

function measure(): void {
  if (!probe) return
  const cs = getComputedStyle(probe)
  const next = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  }
  if (next.top !== safeArea.top || next.right !== safeArea.right || next.bottom !== safeArea.bottom || next.left !== safeArea.left) {
    Object.assign(safeArea, next)
    for (const fn of listeners) fn({ ...safeArea })
  }
}

export function initSafeArea(): void {
  if (probe || typeof document === 'undefined') return
  probe = document.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);' +
    'padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);'
  document.body.appendChild(probe)
  measure()
  window.addEventListener('resize', () => requestAnimationFrame(measure))
  window.addEventListener('orientationchange', () => setTimeout(measure, 200))
}

export function onSafeAreaChange(fn: (i: Insets) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getSafeArea(): Insets {
  return { ...safeArea }
}
