import { Day } from '../util/Day.ts'

const holidayCache: Record<number, number[]> = {}

/**
 * Returns a list of holidays that occur during the given year. Memoized. For
 * your convenience, the array contains day IDs rather than `Day` objects so you
 * can do `holidays.includes(day.id)`.
 * https://blink.ucsd.edu/HR/benefits/time-off/holidays.html
 */
export function getHolidays (year: number): number[] {
  holidayCache[year] ??= [
    // New Year's Day
    Day.from(year, 1, 1),
    // Martin Luther King Jr. Day, observed on the third Monday in January
    Day.from(year, 1, 7).monday.add(14),
    // Presidents' Day, observed on the third Monday in February
    Day.from(year, 2, 7).monday.add(14),
    // César Chávez Day: observed on the last Friday in March
    Day.from(year, 3, 31).last(5),
    // Memorial Day, observed on the last Monday in May
    Day.from(year, 5, 31).monday,
    // Juneteenth National Independence Day, June
    Day.from(year, 6, 19),
    // Independence Day
    Day.from(year, 7, 4),
    // Labor Day (first Monday in September)
    Day.from(year, 9, 7).monday,
    // Veterans Day
    Day.from(year, 9, 11),
    // Thanksgiving Day (fourth Thursday of November)
    Day.from(year, 11, 7).last(4).add(21),
    // Friday after Thanksgiving
    Day.from(year, 11, 7).last(4).add(22),
    // Winter Break (2 days)
    Day.from(year, 12, 24),
    Day.from(year, 12, 25),
    // New Year's Eve (or equivalent)
    Day.from(year, 12, 31)
  ].map(day => day.id)
  return holidayCache[year]
}

/**
 * Calculates the date of Rosh Hashanah in the given year. Rosh Hashanah starts
 * the evening the day before and ends at sundown the day after. Yom Kippur
 * starts sunset 8 days later and ends nightfall 9 days later on 10 Tishri.
 * https://quasar.as.utexas.edu/BillInfo/ReligiousCalendars.html
 *
 * The Jewish New Year affects when fall starts; fall move-in and the beginning
 * of the quarter cannot coincide with the Jewish New Year.
 *
 * Currently not used because I'm not seeing a clear direct correlation between
 * fall start date overlap and Jewish holidays, so I'm just hardcoding
 * exceptions.
 */
function roshHashanah (year: number): Day {
  const golden = (year % 19) + 1
  const rem12g19 = (12 * golden) % 19
  const n =
    (Math.floor(year / 100) - Math.floor(year / 400) - 2) * 492480 +
    765433 * rem12g19 +
    123120 * (year % 4) -
    (313 * year + 89081) * 5
  const date = Day.from(year, 9, Math.floor(n / 492480))
  const fraction = n % 492480
  if (date.day === 0 || date.day === 3 || date.day === 5) {
    return date.add(1)
  } else if (date.day === 1 && fraction >= 442111 && rem12g19 > 11) {
    return date.add(1)
  } else if (date.day === 2 && fraction >= 311676 && rem12g19 > 6) {
    return date.add(2)
  } else {
    return date
  }
}
