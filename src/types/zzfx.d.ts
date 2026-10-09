declare module 'zzfx' {
  export const ZZFX: {
    volume: number
    sampleRate: number
    audioContext: AudioContext
    buildSamples(...params: (number | undefined)[]): number[]
    play(...params: (number | undefined)[]): AudioBufferSourceNode
  }
  export function zzfx(...params: (number | undefined)[]): AudioBufferSourceNode
}
