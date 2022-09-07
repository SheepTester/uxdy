import { Day } from './day.ts'

export type Season = 'FA' | 'WI' | 'SP' | 'S1' | 'S2'

export type Term = {
  start: Day
  end: Day
}

/** When each quarter starts, in days from the start of winter quarter. */
const offset: Record<Season, number> = {
  WI: 0,
  SP: 84,
  S1: 175,
  S2: 210,
  FA: 262
}

/** How long each quarter is, in days. */
const length: Record<Season, number> = {
  FA: 79,
  WI: 75,
  SP: 74,
  S1: 33,
  S2: 33
}

/** Returns the day when winter quarter starts in the given year. */
function winterStart (year: number): Day {
  const jan1 = Day.from(year, 1, 1)
  return Day.from(year, 1, 9 - jan1.day)
}

export function getTerm (year: number, season: Season): Term {
  const start = winterStart(year).add(offset[season])
  return {
    start,
    end: start.add(length[season])
  }
}
