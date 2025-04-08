import { createContext } from 'preact'
import { useContext } from 'preact/hooks'
import { Exam, Meeting, Section } from '../scheduleofclasses/group-sections.ts'
import { getHolidays } from '../terms/holidays.ts'
import { CurrentTerm, getTerm } from '../terms/index.ts'
import { Day } from '../util/Day.ts'
import { Time } from '../util/Time.ts'
import { Moment } from './lib/now.ts'

export type TermMoment = Moment & {
  currentTerm: CurrentTerm
  holidays: Record<number, string>
  isFinals: boolean
  isHoliday: boolean
  isLive: boolean
}

/** Add cached term information to a plain `Moment` object */
export function fromMoment (moment: Moment, isLive: boolean): TermMoment {
  const currentTerm = getTerm(moment.date)
  const holidays = getHolidays(moment.date.year)
  return {
    ...moment,
    currentTerm,
    holidays,
    // Summer sessions' finals week overlaps with classes, it seems like?
    isFinals:
      currentTerm.finals &&
      currentTerm.season !== 'S1' &&
      currentTerm.season !== 'S2',
    isHoliday: !!holidays[moment.date.id],
    isLive
  }
}

/**
 * @param includeBefore Minutes before the meeting to consider as part of the
 * meeting. Useful to determine if a meeting will occur soon but not right now.
 */
export function isMeetingOngoing (
  meeting:
    | Pick<Section, 'kind' | 'time'>
    | Pick<Meeting, 'kind' | 'time'>
    | Pick<Exam, 'kind' | 'time' | 'date'>,
  now: TermMoment,
  includeBefore = 0
): boolean {
  if (!meeting.time) {
    return false
  }
  if (now.isHoliday) {
    return false
  }
  if (meeting.kind === 'exam') {
    // Exam
    if (+meeting.date !== +now.date) {
      return false
    }
  } else if (now.isFinals) {
    // Omit regular meetings during finals week
    return false
  }
  return (
    meeting.time.days.includes(now.date.day) &&
    +meeting.time.start - includeBefore <= +now.time &&
    now.time < meeting.time.end
  )
}

/**
 * Whether a meeting occurs on the given date.
 * @param date A date in the same term as `TermMoment`.
 * @param specialSummer Whether the meeting is from special summer session, in
 * which case checks for S1/S2 bounds shouldn't apply.
 */
export function doesMeetingHappen (
  meeting:
    | Pick<Section, 'kind' | 'time'>
    | Pick<Meeting, 'kind' | 'time'>
    | Pick<Exam, 'kind' | 'time' | 'date'>,
  now: Omit<TermMoment, 'time' | 'date'>,
  date: Day,
  specialSummer = false
): boolean {
  if (!meeting.time) {
    return false
  }
  if (
    now.holidays[date.id] ||
    (!specialSummer &&
      (date < now.currentTerm.termDays.start ||
        date > now.currentTerm.termDays.end))
  ) {
    return false
  }
  if (meeting.kind === 'exam') {
    // Exam
    if (+meeting.date !== +date) {
      return false
    }
  } else if (
    date >= now.currentTerm.termDays.finals &&
    now.currentTerm.season !== 'S1' &&
    now.currentTerm.season !== 'S2'
  ) {
    // Omit regular meetings during finals week during academic year
    return false
  }
  return meeting.time.days.includes(date.day)
}

export const MomentContext = createContext<TermMoment>({
  date: Day.EPOCH,
  time: Time.from(0),
  holidays: {},
  currentTerm: {
    current: false,
    finals: false,
    season: 'FA',
    termDays: { start: Day.EPOCH, finals: Day.EPOCH, end: Day.EPOCH },
    week: -1,
    year: 0
  },
  isFinals: false,
  isHoliday: false,
  isLive: false
})

export function useMoment (): TermMoment {
  return useContext(MomentContext)
}
