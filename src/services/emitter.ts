/** Servisler için küçük tipli dinleyici kümesi. */
export class Listeners<T> {
  private readonly set = new Set<(v: T) => void>()
  on(fn: (v: T) => void): () => void {
    this.set.add(fn)
    return () => this.set.delete(fn)
  }
  emit(v: T): void {
    for (const fn of this.set) fn(v)
  }
}
