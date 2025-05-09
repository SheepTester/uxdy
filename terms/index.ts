import { Day } from '../util/Day.ts'

export type Season = 'FA' | 'WI' | 'SP' | 'S1' | 'S2'
export type Quarter = Season | 'S3' | 'SU'

/** When each quarter starts, in days from the start of winter quarter. */
const offsets: Record<Season, number> = {
  WI: 0,
  SP: 84,
  S1: 175,
  S2: 210,
  FA: 262
}

/** How long each quarter is, in days. */
const lengths: Record<Season, number> = {
  FA: 79,
  WI: 75,
  SP: 74,
  S1: 33,
  S2: 33
}

/** When finals start, in days from the end of the quarter. */
const finalsOffsets: Record<Season, number> = {
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
  if (year < 2028) {
    // Quarter begins the first Monday not before January 3
    const jan1 = Day.from(year, 1, 1)
    return Day.from(year, 1, 9 - jan1.day)
  } else {
    // Quarter begins starting in 2028 is on a Wednesday presumably not before
    // January 3, and instruction begins the following Monday, so the earliest
    // the quarter can begin is January 8.
    const dec30 = Day.from(year, 1, -1)
    return Day.from(year, 1, 14 - dec30.day)
  }
}

export type TermDays = {
  start: Day
  finals: Day
  end: Day
}

export function getTermDays (year: number, season: Season): TermDays {
  let offset = offsets[season]
  if ((season === 'FA' ? year + 1 : year) === 2000) {
    // Academic year 1999–2000 was delayed by a year, affecting FA99 to S200.
    // Was this due to Y2K?
    offset += 7
  }
  if (season === 'FA' && [1995, 2001, 2006, 2014, 2020].includes(year)) {
    // All of these years overlap with Rosh Hashanah, but many others do too,
    // but they aren't shifted, which is strange. I'm hardcoding these for now.
    if (year < 2010) {
      offset -= 7
    } else {
      offset += 7
    }
  }
  const start = winterStart(year).add(offset)
  return {
    start,
    finals: start.add(lengths[season] - finalsOffsets[season]),
    end: start.add(
      lengths[season] +
        // It seems spring ended on a Saturday before 1995
        (year <= 1995 && season === 'SP'
          ? 1
          : // Summer session in the 20th century ended on a Friday
          year < 2000 && (season === 'S1' || season === 'S2')
            ? -1
            : 0)
    )
  }
}

export type CurrentTerm = {
  year: number
  season: Season
  termDays: TermDays
} & (
  | {
      current: true
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
      week: -1
      finals: false
    }
)

/**
 * Determines the quarter that the day is in, or the next term if the day is
 * during a break.
 */
export function getTerm (day: Day): CurrentTerm {
  let termDays: TermDays | null = null
  let season: Season | null = null
  let current = false
  for (const term of ['WI', 'SP', 'S1', 'S2', 'FA'] as const) {
    termDays = getTermDays(day.year, term)
    if (day <= termDays.end) {
      season = term
      current = day >= termDays.start
      break
    }
  }
  if (termDays === null) {
    // Just to satisfy TypeScript
    throw new Error('Unreachable.')
  }
  const year = season === null ? day.year + 1 : day.year
  if (season === null) {
    season = 'WI'
    termDays = getTermDays(year, season)
  }
  if (current) {
    const finals = current && day >= termDays.finals
    const week = Math.floor((+day.monday - +termDays.start) / 7) + 1
    return { year, season, current, termDays, week, finals }
  } else {
    return { year, season, current, termDays, week: -1, finals: false }
  }
}

export function termCode (year: number, quarter: Quarter): string {
  return quarter + (year % 100).toString().padStart(2, '0')
}

export function termName (year: number, quarter: Quarter): string {
  return `${names[quarter]} ${year}`
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
