import { Day } from '../util/Day.ts'

const holidayCache: Record<number, Record<number, string>> = {}

/**
 * Returns an objecting mapping the day IDs of holidays that occur during the
 * given year to their names. Memoized.
 * https://blink.ucsd.edu/HR/benefits/time-off/holidays.html
 */
export function getHolidays (year: number): Record<number, string> {
  holidayCache[year] ??= {
    [Day.from(year, 1, 1).id]: "New Year's Day",
    // third Monday in January
    [Day.from(year, 1, 7).monday.add(14).id]: 'Martin Luther King Jr. Day',
    // third Monday in February
    [Day.from(year, 2, 7).monday.add(14).id]: "Presidents' Day",
    // last Friday in March
    [Day.from(year, 3, 31).last(5).id]: 'César Chávez Day',
    // last Monday in May
    [Day.from(year, 5, 31).monday.id]: 'Memorial Day',
    [Day.from(year, 6, 19).id]: 'Juneteenth',
    [Day.from(year, 7, 4).id]: 'Independence Day',
    // first Monday in September
    [Day.from(year, 9, 7).monday.id]: 'Labor Day',
    [Day.from(year, 9, 11).id]: 'Veterans Day',
    // fourth Thursday of November
    [Day.from(year, 11, 7).last(4).add(21).id]: 'Thanksgiving',
    [Day.from(year, 11, 7).last(4).add(22).id]: 'Day after Thanksgiving',
    [Day.from(year, 12, 24).id]: 'Christmas Eve',
    [Day.from(year, 12, 25).id]: 'Christmas',
    [Day.from(year, 12, 31).id]: "New Year's Eve"
  }
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
