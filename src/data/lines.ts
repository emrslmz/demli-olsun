/** Müşteri replikleri (Bölüm 6.3): metinler dil dosyasında (tr.lines), burada kova seçimi ve emoji. */

import { tr } from '@/i18n/tr'
import type { CustomerId } from './customers'

export type LineBucket = 'p95' | 'p85' | 'p70' | 'p50' | 'reject' | 'overflow' | 'impatient' | 'left'

export const BUCKET_EMOJI: Record<LineBucket, string> = {
  p95: '😍',
  p85: '😊',
  p70: '🙂',
  p50: '😕',
  reject: '😠',
  overflow: '💦',
  impatient: '⏰',
  left: '😤',
}

export function bucketFor(accuracy: number, accepted: boolean): LineBucket {
  if (!accepted) return 'reject'
  if (accuracy >= 95) return 'p95'
  if (accuracy >= 85) return 'p85'
  if (accuracy >= 70) return 'p70'
  return 'p50'
}

export function pickLine(customer: CustomerId, bucket: LineBucket, rand: () => number = Math.random): string {
  const list = tr.lines[customer][bucket]
  return list[Math.floor(rand() * list.length)] as string
}
