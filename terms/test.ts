import { assertEquals } from 'std/testing/asserts.ts'
import { Day } from './day.ts'
import { getTerm, getTermDays } from './index.ts'
import { data } from './test-data.ts'

Deno.test('getTermDays', async t => {
  for (const { year, season, start, end } of data) {
    const name = `${season}${((year % 100) + '').padStart(2, '0')}`
    await t.step(name, () => {
      const term = getTermDays(year, season)
      assertEquals(`start ${term.start}`, `start ${start}`)
      assertEquals(`end ${term.end}`, `end ${end}`)
    })
  }
})

Deno.test('getTerm', async t => {
  // Start of FA21
  assertEquals(getTerm(Day.from(2021, 9, 22)), {
    year: 2021,
    season: 'FA',
    current: false,
    finals: false
  })
  assertEquals(getTerm(Day.from(2021, 9, 23)), {
    year: 2021,
    season: 'FA',
    current: true,
    finals: false
  })

  // Beginning of finals
  assertEquals(getTerm(Day.from(2021, 12, 3)), {
    year: 2021,
    season: 'FA',
    current: true,
    finals: false
  })
  assertEquals(getTerm(Day.from(2021, 12, 4)), {
    year: 2021,
    season: 'FA',
    current: true,
    finals: true
  })

  // End of FA21
  assertEquals(getTerm(Day.from(2021, 12, 11)), {
    year: 2021,
    season: 'FA',
    current: true,
    finals: true
  })
  assertEquals(getTerm(Day.from(2021, 12, 12)), {
    year: 2022,
    season: 'WI',
    current: false,
    finals: false
  })

  // New years
  assertEquals(getTerm(Day.from(2021, 12, 31)), {
    year: 2022,
    season: 'WI',
    current: false,
    finals: false
  })
  assertEquals(getTerm(Day.from(2022, 1, 1)), {
    year: 2022,
    season: 'WI',
    current: false,
    finals: false
  })

  // Start of WI22
  assertEquals(getTerm(Day.from(2022, 1, 2)), {
    year: 2022,
    season: 'WI',
    current: false,
    finals: false
  })
  assertEquals(getTerm(Day.from(2022, 1, 3)), {
    year: 2022,
    season: 'WI',
    current: true,
    finals: false
  })

  // Finals
  assertEquals(getTerm(Day.from(2022, 3, 15)), {
    year: 2022,
    season: 'WI',
    current: true,
    finals: true
  })

  // Spring break
  assertEquals(getTerm(Day.from(2022, 3, 24)), {
    year: 2022,
    season: 'SP',
    current: false,
    finals: false
  })

  // Summer break
  assertEquals(getTerm(Day.from(2022, 6, 26)), {
    year: 2022,
    season: 'S1',
    current: false,
    finals: false
  })

  // Summer session
  assertEquals(getTerm(Day.from(2022, 9, 2)), {
    year: 2022,
    season: 'S2',
    current: true,
    finals: true
  })

  // Today
  assertEquals(getTerm(Day.from(2022, 9, 8)), {
    year: 2022,
    season: 'FA',
    current: false,
    finals: false
  })
})
