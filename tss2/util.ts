/**
 * Copied from
 * https://github.com/SheepTester-forks/ucsd-historical-schedule-of-classes/blob/main/scrape/src/util.ts
 */
export class ConcurrencyLimiter {
  #spots: number
  #queue: PromiseWithResolvers<void>[] = []

  constructor (max: number) {
    this.#spots = max
  }

  async acquire (): Promise<Disposable> {
    if (this.#spots > 0) {
      this.#spots--
    } else {
      const entry = Promise.withResolvers<void>()
      this.#queue.push(entry)
      await entry.promise
    }
    let disposed = false
    return {
      [Symbol.dispose]: () => {
        if (disposed) {
          return
        }
        disposed = true
        const next = this.#queue.shift()
        if (next) {
          next.resolve()
        } else {
          this.#spots++
        }
      }
    }
  }
}
