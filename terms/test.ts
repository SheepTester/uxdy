import { assertEquals } from 'std/testing/asserts.ts'
import { Day } from '../util/Day.ts'
import { getTerm, getTermDays, termCode } from './index.ts'
import summerDates from './summer-dates.json' assert { type: 'json' }
import { data } from './test-data.ts'

Deno.test("getTermDays (from UCSD's calendars)", async t => {
  for (const { year, season, start, end } of data.sort(
    (a, b) => +a.start - +b.start
  )) {
    const name = termCode(year, season)
    await t.step(name, () => {
      const term = getTermDays(year, season)
      assertEquals(
        `start ${term.start} (${term.start.dayName('short')})`,
        `start ${start} (${start.dayName('short')})`
      )
      assertEquals(
        `end ${term.end} (${term.end.dayName('short')})`,
        `end ${end} (${end.dayName('short')})`
      )
    })
  }
})

Deno.test("getTermDays (from ScheduleOfClasses' summer sessions)", async t => {
  for (const [year, session, startStr, endStr] of summerDates) {
    const quarter = session === 1 ? 'S1' : 'S2'
    const name = termCode(+year, quarter)
    const start = Day.parse(String(startStr))
    const end = Day.parse(String(endStr))
    await t.step(name, () => {
      if (!start || !end) {
        throw new TypeError(`Failed to parse ${startStr} or ${endStr}.`)
      }
      const term = getTermDays(+year, quarter)
      assertEquals(
        `start ${term.start} (${term.start.dayName('short')})`,
        `start ${start} (${start.dayName('short')})`
      )
      assertEquals(
        `end ${term.end} (${term.end.dayName('short')})`,
        `end ${end} (${end.dayName('short')})`
      )
    })
  }
})

Deno.test('getTerm', async () => {
  // Start of FA21
  assertEquals(getTerm(Day.from(2021, 9, 22)), {
    year: 2021,
    season: 'FA',
    current: false,
    week: -1,
    finals: false
  })
  assertEquals(getTerm(Day.from(2021, 9, 23)), {
    year: 2021,
    season: 'FA',
    current: true,
    week: 0,
    finals: false
  })

  // Beginning of finals
  assertEquals(getTerm(Day.from(2021, 12, 3)), {
    year: 2021,
    season: 'FA',
    current: true,
    week: 10,
    finals: false
  })
  assertEquals(getTerm(Day.from(2021, 12, 4)), {
    year: 2021,
    season: 'FA',
    current: true,
    week: 10,
    finals: true
  })

  // End of FA21
  assertEquals(getTerm(Day.from(2021, 12, 11)), {
    year: 2021,
    season: 'FA',
    current: true,
    week: 11,
    finals: true
  })
  assertEquals(getTerm(Day.from(2021, 12, 12)), {
    year: 2022,
    season: 'WI',
    current: false,
    week: -1,
    finals: false
  })

  // New years
  assertEquals(getTerm(Day.from(2021, 12, 31)), {
    year: 2022,
    season: 'WI',
    current: false,
    week: -1,
    finals: false
  })
  assertEquals(getTerm(Day.from(2022, 1, 1)), {
    year: 2022,
    season: 'WI',
    current: false,
    week: -1,
    finals: false
  })

  // Start of WI22
  assertEquals(getTerm(Day.from(2022, 1, 2)), {
    year: 2022,
    season: 'WI',
    current: false,
    week: -1,
    finals: false
  })
  assertEquals(getTerm(Day.from(2022, 1, 3)), {
    year: 2022,
    season: 'WI',
    current: true,
    week: 1,
    finals: false
  })

  // Finals
  assertEquals(getTerm(Day.from(2022, 3, 15)), {
    year: 2022,
    season: 'WI',
    current: true,
    week: 11,
    finals: true
  })

  // Spring break
  assertEquals(getTerm(Day.from(2022, 3, 24)), {
    year: 2022,
    season: 'SP',
    current: false,
    week: -1,
    finals: false
  })

  // Summer break
  assertEquals(getTerm(Day.from(2022, 6, 26)), {
    year: 2022,
    season: 'S1',
    current: false,
    week: -1,
    finals: false
  })

  // Summer session
  assertEquals(getTerm(Day.from(2022, 9, 2)), {
    year: 2022,
    season: 'S2',
    current: true,
    week: 5,
    finals: true
  })

  // Today
  assertEquals(getTerm(Day.from(2022, 9, 8)), {
    year: 2022,
    season: 'FA',
    current: false,
    week: -1,
    finals: false
  })
})
