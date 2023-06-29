import { Day, DAY_NUMS } from './Day.ts'

/**
 * A time.
 */
export class Time {
  /** The hour (24-hour). */
  hour: number
  /** The minute. */
  minute: number

  constructor (hour: number, minute: number) {
    this.hour = hour
    this.minute = minute
  }

  /**
   * Displays the time in a 12-hour format Americans are familiar with.
   */
  toString (hour24 = false): string {
    const minute = this.minute.toString().padStart(2, '0')
    return hour24
      ? `${this.hour.toString().padStart(2, '0')}:${minute}`
      : `${((this.hour + 11) % 12) + 1}:${minute} ${
          this.hour < 12 ? 'a' : 'p'
        }m`
  }

  /**
   * Returns the minutes since 00:00. This allows `Time` to be used with JS's
   * comparison operators.
   */
  valueOf (): number {
    return this.hour * 60 + this.minute
  }

  /** Create a `Time` from the number of minutes since 00:00. */
  static from (minutes: number): Time {
    return new Time(Math.floor(minutes / 60), minutes % 60)
  }

  /** Parses a 24-hour timestamp. */
  static parse24 (string: string): Time | null {
    const [hour, minute] = string.split(':').map(Number)
    if (
      Number.isInteger(hour) &&
      hour >= 0 &&
      hour < 24 &&
      Number.isInteger(minute) &&
      minute >= 0 &&
      minute < 60
    ) {
      return new Time(hour, minute)
    } else {
      return null
    }
  }
}

/**
 * A time period on a given day.
 */
export class Period {
  /** The day of the week. */
  day: number
  /** The start time. */
  start: Time
  /** The end time. */
  end: Time

  constructor (day: number, start: Time, end: Time) {
    this.day = day
    this.start = start
    this.end = end
  }

  /**
   * Whether two time periods overlap. A time period starting when another ends
   * is not considered an intersection.
   */
  intersects (other: Period) {
    return (
      this.day === other.day && this.start < other.end && other.start < this.end
    )
  }

  /**
   * Displays the time range.
   */
  displayTime () {
    return `${this.start}–${this.end}`
  }

  /**
   * Returns the name of the day the time period is on.
   */
  dayName () {
    return Day.dayName(this.day, 'long', 'en-US')
  }

  /**
   * Displays the time range with the day name. Probably should just be used for
   * debug purposes because in most cases you'd rather have more control over
   * the formatting. Use `displayTime` and `dayName` instead.
   */
  toString () {
    return `${this.displayTime()} on ${this.dayName()}`
  }

  static readonly #MINUTES_PER_DAY = 24 * 60

  /**
   * Returns the number of minutes between the beginning of the week and the
   * start of the time range. This might be useful for sorting time periods
   * chronologically.
   */
  valueOf () {
    return this.day * Period.#MINUTES_PER_DAY + +this.start
  }
}
