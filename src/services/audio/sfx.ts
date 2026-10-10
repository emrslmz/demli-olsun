/** ZzFX ile prosedürel ses efektleri (yer tutucu). Parametreler: ZzFX 1.4 sırası. */

export type SfxName =
  | 'drop'
  | 'sugarPlop'
  | 'spoonClink'
  | 'glassTick'
  | 'serve'
  | 'star'
  | 'combo'
  | 'lifeLost'
  | 'overflow'
  | 'coin'
  | 'button'
  | 'purchase'
  | 'leagueUp'
  | 'reject'
  | 'pop'
  | 'whoosh'
  | 'tick'

// [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide,
//  pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter]
export const SFX: Record<SfxName, (number | undefined)[]> = {
  drop: [0.5, 0.1, 1300, 0, 0.01, 0.07, 0, 1.6, -40, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.02],
  sugarPlop: [0.9, 0.05, 260, 0.005, 0.03, 0.14, 0, 1, -18, 0, 0, 0, 0, 0.1, 0, 0, 0, 0.7, 0.04],
  spoonClink: [0.45, 0.03, 2600, 0, 0.01, 0.3, 1, 2, 0, 0, 700, 0.04, 0.07, 0, 0, 0, 0, 0.4, 0.12],
  glassTick: [0.5, 0.02, 1900, 0, 0, 0.09, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.02],
  serve: [0.45, 0.02, 520, 0.02, 0.06, 0.2, 0, 1, 0, 0, 260, 0.06],
  star: [0.55, 0, 880, 0.01, 0.08, 0.3, 0, 1.5, 0, 0, 440, 0.08],
  combo: [0.55, 0, 660, 0.01, 0.1, 0.35, 0, 1.2, 0, 0, 330, 0.06, 0.07],
  lifeLost: [0.7, 0.05, 220, 0.01, 0.15, 0.4, 3, 1, -5, 0, 0, 0, 0, 0.3],
  overflow: [0.6, 0.1, 180, 0.05, 0.3, 0.45, 4, 1, 0, 0, 0, 0, 0, 1.5],
  coin: [0.45, 0, 1500, 0, 0.02, 0.18, 1, 1.5, 0, 0, 900, 0.05],
  button: [0.35, 0, 700, 0, 0.01, 0.05, 0, 1],
  purchase: [0.6, 0, 523, 0.02, 0.15, 0.4, 0, 1, 0, 0, 262, 0.1, 0.12],
  leagueUp: [0.7, 0, 392, 0.03, 0.3, 0.5, 0, 1, 0, 0, 196, 0.12, 0.15],
  reject: [0.6, 0.05, 160, 0.02, 0.12, 0.25, 2, 1, -3],
  pop: [0.5, 0.05, 520, 0, 0.01, 0.06, 0, 1, 30],
  whoosh: [0.35, 0.1, 300, 0.05, 0.1, 0.2, 4, 0, 20, 0, 0, 0, 0, 2],
  tick: [0.25, 0, 1100, 0, 0, 0.03, 1, 1],
}
