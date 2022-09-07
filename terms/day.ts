// Based on https://github.com/Orbiit/gunn-web-app/blob/master/js/date.js

export const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * A single, unified Day object representing a day (no time). Months are
 * 1-indexed.
 */
export class Day {
  #date: Date

  constructor (utcDate: Date) {
    this.#date = utcDate
  }

  get year (): number {
    return this.#date.getUTCFullYear()
  }

  get month (): number {
    return this.#date.getUTCMonth() + 1
  }

  get date (): number {
    return this.#date.getUTCDate()
  }

  get day (): number {
    return this.#date.getUTCDay()
  }

  /**
   * Returns an arbitrary identifier for the date, the number of days between
   * the Unix epoch and this date. It should be unique per date, so it can be
   * used as an ID.
   */
  get id (): number {
    return this.#date.getTime() / MS_PER_DAY
  }

  /**
   * Returns the Sunday of a week, which can be used to get a unique ID for a
   * week.
   */
  get sunday (): Day {
    return this.add(-this.day)
  }

  /**
   * Return a new `Day` that is `days` days after this date.
   */
  add (days: number): Day {
    const clone = new Date(this.#date)
    clone.setUTCDate(this.date + days)
    return new Day(clone)
  }

  /**
   * Converts the Date to the date in local time at the start of the day.
   */
  toLocal (): Date {
    return new Date(this.year, this.month - 1, this.date)
  }

  /**
   * Returns the ISO 8601 representation of the date: YYYY-MM-DD.
   */
  toString (): string {
    return [
      this.year.toString().padStart(4, '0'),
      this.month.toString().padStart(2, '0'),
      this.date.toString().padStart(2, '0')
    ].join('-')
  }

  /**
   * Returns the day ID (see `Day#dayId`). JS calls this implicitly for things
   * like comparisons, so you can directly compare a `Day`.
   */
  valueOf (): number {
    return this.id
  }

  [Symbol.for('Deno.customInspect')] (): string {
    return this.toString()
  }

  static get EPOCH (): Day {
    return new Day(new Date(0))
  }

  static from (year: number, month: number, date: number): Day {
    return new Day(new Date(Date.UTC(year, month - 1, date)))
  }

  static today (): Day {
    const today = new Date()
    return Day.from(today.getFullYear(), today.getMonth(), today.getDate())
  }

  static parse (str: string): Day | null {
    const [year, month, date] = str.split('-').map(Number)
    const parsed = Day.from(year, month - 1, date)
    return Number.isNaN(parsed.id) ? null : parsed
  }

  static fromId (dayId: number): Day {
    return Day.EPOCH.add(dayId)
  }
}
