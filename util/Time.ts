import { Day } from './Day.ts'

/**
 * A time during a day. Only stores hours and minutes. The represented time may
 * not always exist, such as during a daylight savings switch.
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

  get #utcDate (): Date {
    return new Date(Date.UTC(2000, 0, 1, this.hour, this.minute))
  }

  /**
   * Formats a date range from `this` to `end` using the Intl API. See
   * `toString` for more details on what options are set by default.
   */
  formatRange (
    end: Time,
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions
  ): string {
    return new Intl.DateTimeFormat(locales, {
      hour: 'numeric',
      minute: 'numeric',
      ...options,
      timeZone: 'UTC'
    }).formatRange(this.#utcDate, end.#utcDate)
  }

  /**
   * Displays the time in a 12-hour format Americans are familiar with. Pass
   * `true` to use 24-hour instead, or pass arguments to `toLocaleTimeString`
   * for more formatting options.
   *
   * When using `toLocaleTimeString`, the time zone is set to UTC to avoid any
   * daylight savings jankiness. Since this object doesn't store seconds, `hour`
   * and `minute` are set to `numeric` by default to hide the seconds; this can
   * be overridden.
   *
   * Pass a boolean (or omit all parameters) to avoid relying on the Intl API if
   * you need the output to be predictable (such as for an HTML time input).
   *
   * @example
   * const time = new Time(3, 1)
   * time.toString() // '3:01 am'
   * time.toString(true) // '03:01'
   * // Use Intl API
   * time.toString([]) // (depends on runtime's default locale)
   * time.toString(['ja-JP']) // '3:01'
   * time.toString(['en-UK'], { hour: 'numeric', minute: 'numeric' }) // '03:01'
   */
  toString (
    ...args: Parameters<Date['toLocaleTimeString']> | [boolean]
  ): string {
    const minute = this.minute.toString().padStart(2, '0')
    return typeof args[0] === 'boolean' && args[0]
      ? `${this.hour.toString().padStart(2, '0')}:${minute}`
      : args.length > 0 && typeof args[0] !== 'boolean'
      ? this.#utcDate.toLocaleTimeString(args[0], {
          hour: 'numeric',
          minute: 'numeric',
          ...args[1],
          timeZone: 'UTC'
        })
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
