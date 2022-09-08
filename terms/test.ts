import { assertEquals } from 'https://deno.land/std@0.154.0/testing/asserts.ts'
import { getTermDays } from './index.ts'
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
