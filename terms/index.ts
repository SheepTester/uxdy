import { Day } from './day.ts'

export type Season = 'FA' | 'WI' | 'SP' | 'S1' | 'S2'

export type TermDays = {
  start: Day
  finals: Day
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

/** When finals start, in days from the end of the quarter. */
const finalsOffset: Record<Season, number> = {
  FA: 7,
  WI: 7,
  SP: 6, // Spring ends on a Friday, unlike FA/WI
  S1: 1,
  S2: 1
}

/** Returns the day when winter quarter starts in the given year. */
function winterStart (year: number): Day {
  const jan1 = Day.from(year, 1, 1)
  return Day.from(year, 1, 9 - jan1.day)
}

export function getTermDays (year: number, season: Season): TermDays {
  const start = winterStart(year).add(offset[season])
  return {
    start,
    finals: start.add(length[season] - finalsOffset[season]),
    end: start.add(length[season])
  }
}

type DayTerm = {
  year: number
  season: Season
  /** If false, then the year/season refers to the following quarter. */
  current: boolean
}

/**
 * Determines the quarter that the day is in, or the next term if the day is
 * during a break.
 */
export function getTerm (day: Day): DayTerm {
  const daysSinceWinter = +day - +winterStart(day.year)
  let season: Season | null = null
  let current = false
  for (const term of ['WI', 'SP', 'S1', 'S2', 'FA'] as const) {
    if (daysSinceWinter <= offset[term] + length[term]) {
      season = term
      current = daysSinceWinter >= offset[term]
      break
    }
  }
  const year = season === null ? day.year + 1 : day.year
  season ??= 'WI'
  return { year, season, current }
}
