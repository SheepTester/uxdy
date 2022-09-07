import { assertEquals } from 'https://deno.land/std@0.154.0/testing/asserts.ts'
import { getTerm } from './index.ts'
import { data } from './test-data.ts'

Deno.test('getTerm', async t => {
  for (const { year, season, start, end } of data) {
    const name = `${season}${((year % 100) + '').padStart(2, '0')}`
    await t.step(name, () => {
      const term = getTerm(year, season)
      assertEquals(`start ${term.start}`, `start ${start}`)
      assertEquals(`end ${term.end}`, `end ${end}`)
    })
  }
})
