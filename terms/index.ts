import { Day } from '../util/Day.ts'

export type Season = 'FA' | 'WI' | 'SP' | 'S1' | 'S2'
export type Quarter = Season | 'S3' | 'SU'

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

/** Names of each term, according to WebReg. */
const names: Record<Quarter, string> = {
  FA: 'Fall',
  WI: 'Winter',
  SP: 'Spring',
  S1: 'Summer Session I',
  S2: 'Summer Session II',
  S3: 'Special Summer Session',
  SU: 'Summer Med School'
}

/** Returns the day when winter quarter starts in the given year. */
function winterStart (year: number): Day {
  const jan1 = Day.from(year, 1, 1)
  return Day.from(year, 1, 9 - jan1.day)
}

export type TermDays = {
  start: Day
  finals: Day
  end: Day
}

export function getTermDays (year: number, season: Season): TermDays {
  const start = winterStart(year).add(offset[season])
  return {
    start,
    finals: start.add(length[season] - finalsOffset[season]),
    end: start.add(length[season])
  }
}

export type CurrentTerm =
  | {
      current: true
      year: number
      season: Season
      /**
       * Week number of the given day. The first Monday of the quarter is in week 1;
       * if there are days before it, then they are in week 0. Finals week for fall,
       * winter, and spring quarter is mostly in week 11.
       */
      week: number
      /** Whether finals are ongoing. */
      finals: boolean
    }
  | {
      /** The year/season refers to the following quarter. */
      current: false
      year: number
      season: Season
      week: -1
      finals: false
    }

/**
 * Determines the quarter that the day is in, or the next term if the day is
 * during a break.
 */
export function getTerm (day: Day): CurrentTerm {
  const winterStartDay = winterStart(day.year).id
  const daysSinceWinter = day.id - winterStartDay
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
  if (current) {
    const finals =
      current &&
      daysSinceWinter >= offset[season] + length[season] - finalsOffset[season]
    const week =
      Math.floor((day.monday.id - (winterStartDay + offset[season])) / 7) + 1
    return { year, season, current, week, finals }
  } else {
    return { year, season, current, week: -1, finals: false }
  }
}

export function termCode (year: number, season: Quarter): string {
  return season + (year % 100).toString().padStart(2, '0')
}

export function termName (year: number, season: Quarter): string {
  return `${names[season]} ${year}`
}

if (import.meta.main) {
  console.log(
    ['Start year', 'Fall start', 'Fall end', 'Winter start', 'Spring end'].join(
      '\t'
    )
  )
  for (let year = 2005; year <= 2028; year++) {
    const { end: springEnd } = getTermDays(year, 'SP')
    const { start: fallStart, end: fallEnd } = getTermDays(year, 'FA')
    const { start: winterStart } = getTermDays(year + 1, 'WI')
    console.log([+fallStart - +springEnd, +winterStart - +fallEnd].join('\t'))
  }
}
