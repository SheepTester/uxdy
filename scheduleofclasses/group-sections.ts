// deno run --allow-read scheduleofclasses/group-sections.ts SP23
// Prints list of remote sections.

import { Day } from '../util/Day.ts'
import {
  getCourses,
  readCourses,
  ScrapedCourse,
  ScrapedResult
} from './scrape.ts'

export type MeetingTime<Time = number> = {
  /**
   * Sorted array of numbers 0-6 representing days of the week. 0 is Sunday.
   */
  days: number[]
  /** In minutes since the start of the day. */
  start: Time
  /** In minutes since the start of the day. */
  end: Time
}
/**
 * Represents a consistent and continuous block of time. If, say, a lecture
 * normally meets at 10 am MWF but also has a Wednesday 6 pm meeting for a
 * physics quiz, the 6 pm meeting will be represented as a separate lecture
 * meeting.
 */
export type BaseMeeting = {
  /** eg LE, DI, LA, FI, MI, etc. */
  type: string
  /** Null if TBA. */
  time: MeetingTime | null
  /** Null if TBA. */
  location: {
    building: string
    room: string
  } | null
}
export type Section = BaseMeeting & {
  kind: 'section'
  /** The section code of the enrollable section, eg A01, A02. */
  code: string
  capacity: number
}
export type Meeting = BaseMeeting & {
  kind: 'meeting'
  /**
   * The section code of the additional meeting, eg A00, A51, etc. Note that
   * there may be multiple meetings with the same code.
   */
  code: string
}
export type Exam = BaseMeeting & {
  kind: 'exam'
  /** UTC Date. */
  date: Day
}
export type Group = {
  /**
   * The section code for the lecture/seminar "in charge" of the group, eg A00
   * or 001.
   */
  code: string
  /** Individual sections where students have to select one to enroll in. */
  sections: Section[]
  /** Additional meetings, such as a lecture, that all sections share. */
  meetings: Meeting[]
  /** Exams, such as finals, that meet on a specific day. */
  exams: Exam[]
  /** Empty if taught by Staff. */
  instructors: { first: string; last: string }[]
  dateRange?: { start: Day; end: Day }
  /**
   * Coscheduled groups are groups that share:
   * - the same instructors,
   * - the same non-TBA location (including RCLAS classrooms), and
   * - the same meeting times.
   * TODO
   */
  coscheduled: Group | Group[]
}
export type Course = {
  /** The subject and number, joined by a space, eg "CSE 11." */
  code: string
  title: string
  catalog?: string
  groups: Group[]
}

function getDateRange (
  course: ScrapedCourse,
  letter: string
): { start: Day; end: Day } | undefined {
  // Assumes numeric group codes start at 001, so only NaN (for +'A' etc) will
  // be falsy. TODO: Are groups guaranteed to be in order?
  const dateRange =
    course.dateRanges[(+letter || (letter.codePointAt(0) ?? 0) - 0x40) - 1]
  return dateRange
    ? { start: Day.from(...dateRange[0]), end: Day.from(...dateRange[1]) }
    : undefined
}
export function groupSections (result: ScrapedResult): Record<string, Course> {
  const courses: Record<string, Course> = {}
  for (const course of result.courses) {
    const groups: Record<string, Group> = {}
    let lastGroup: Group | null = null
    for (const section of course.sections) {
      if (section.cancelled) {
        continue
      }
      const meeting: BaseMeeting = {
        type: section.type,
        time: section.time,
        location: section.location
      }

      if (section.section instanceof Day) {
        if (!lastGroup) {
          // For some reason, SP23 LTWL 194A's A00 section doesn't show on
          // ScheduleOfClasses, only WebReg.
          continue
        }
        lastGroup.exams.push({
          kind: 'exam',
          ...meeting,
          date: section.section
        })
        continue
      }

      const isLetter = /^[A-Z]/.test(section.section)
      const letter = isLetter ? section.section[0] : section.section
      // NOTE: A00 may not be the first section. Some courses (eg S223 BICD
      // 100R) do not have lectures, so the first section is A01, a DI.
      groups[letter] ??= {
        code: section.section,
        sections: [],
        meetings: [],
        exams: [],
        instructors: section.instructors.map(([first, last]) => ({
          first,
          last
        })),
        dateRange: getDateRange(course, letter),
        coscheduled: []
      }
      lastGroup = groups[letter]

      if (section.selectable) {
        groups[letter].sections.push({
          kind: 'section',
          ...meeting,
          code: section.section,
          capacity: section.selectable.capacity
        })
      } else {
        groups[letter].meetings.push({
          kind: 'meeting',
          ...meeting,
          code: section.section
        })
      }
    }

    const code = `${course.subject} ${course.number}`
    courses[code] = {
      code,
      title: course.title,
      catalog: course.catalog,
      groups: Object.values(groups)
    }
  }
  return courses
}

function printRemoteSections (
  term: string,
  courses: Record<string, Course>
): void {
  const seasons: Record<string, string> = {
    FA: 'Fall',
    WI: 'Winter',
    SP: 'Spring',
    S1: 'Summer Session I',
    S2: 'Summer Session II',
    S3: 'Special Summer Session',
    SU: 'Summer Med School'
  }
  console.log(`## ${term}: ${seasons[term.slice(0, 2)]} 20${term.slice(2)}`)
  console.log()
  for (const course of Object.values(courses)) {
    const onlineSections = course.groups.flatMap(group =>
      group.meetings.every(
        meeting => !meeting.location || meeting.location.building === 'RCLAS'
      ) &&
      group.exams.every(
        exam => !exam.location || exam.location.building === 'RCLAS'
      )
        ? group.sections
            .filter(section => section.location?.building === 'RCLAS')
            .map(section => section.code)
        : []
    )
    if (onlineSections.length > 0) {
      console.log(`- ${course.code}: ${onlineSections.join(', ')}`)
    }
  }
}

if (import.meta.main) {
  const term = Deno.args[0] || 'SP23'

  const result: ScrapedResult =
    Deno.args[1] === 'fetch'
      ? await getCourses(term, true)
      : await readCourses(`./scheduleofclasses/terms/${term}.json`)

  // Please put findings in README.md
  // - S323: 2023-06-19 2023-09-08 -> no overlap with SP or FA (but it can start
  //   before S123)
  // - SU23: 2023-05-09 2023-06-26 -> overlap with SP !! but for some reason,
  //   all their locations are TBA, so I could omit it from the app
  // - SU18: 2018-05-14 2018-07-02
  // console.log(Day.fromId(starts), Day.fromId(ends))
  const courses = groupSections(result)

  const startMost = Day.min(
    Object.values(courses).flatMap(course =>
      course.groups.flatMap(group =>
        group.dateRange ? [group.dateRange.start] : []
      )
    )
  )
  const endMost = Day.max(
    Object.values(courses).flatMap(course =>
      course.groups.flatMap(group =>
        group.dateRange ? [group.dateRange.end] : []
      )
    )
  )
  const starts: Record<number, number> = {}
  const ends: Record<number, number> = {}
  for (const course of Object.values(courses)) {
    for (const group of course.groups) {
      if (group.dateRange) {
        starts[group.dateRange.start.day] ??= 0
        starts[group.dateRange.start.day]++
        ends[group.dateRange.end.day] ??= 0
        ends[group.dateRange.end.day]++
      }
    }
  }
  console.log(starts, ends, startMost, endMost)
  // printRemoteSections(courses)

  type Period = {
    day: number
    start: number
    end: number
    course: string
    code: string
    type: string
    location: string
  }
  function findOverlap (periods: Period[], pd: Period): Period | null {
    for (const period of periods) {
      if (
        period.day === pd.day &&
        period.start < pd.end &&
        pd.start < period.end
      ) {
        return period
      }
    }
    return null
  }
  const profs: Record<string, Period[]> = {}
  for (const course of Object.values(courses)) {
    for (const group of course.groups) {
      if (group.instructors.length === 0) {
        continue
      }
      const profName = group.instructors
        .map(({ first, last }) => `${first} ${last}`)
        .join(', ')
      profs[profName] ??= []
      // DI sections can overlap. I guess we can assume that professors don't
      // attend sections unless it's the only meetings of the course?
      const meetings: (Meeting | Section)[] =
        group.meetings.length > 0
          ? [...group.meetings, ...group.sections]
          : group.sections
      for (const meeting of meetings) {
        if (!meeting.time) {
          continue
        }
        for (const day of meeting.time.days) {
          const period: Period = {
            day,
            start: meeting.time.start,
            end: meeting.time.end,
            course: course.code,
            code: 'code' in meeting ? meeting.code : group.code,
            type: meeting.type,
            location: meeting.location
              ? `${meeting.location.building} ${meeting.location.room}`
              : 'TBA'
          }
          const overlap = findOverlap(profs[profName], period)
          if (
            overlap &&
            period.location !== 'TBA' &&
            period.location === overlap.location
          ) {
            // console.log(
            //   period.course,
            //   overlap.course,
            //   period.code === overlap.code
            //     ? period.code
            //     : [period.code, overlap.code],
            //   period.type === overlap.type
            //     ? overlap.type
            //     : [period.type, overlap.type],
            //   period.start === overlap.start && period.end === overlap.end
            //     ? ''
            //     : [
            //         [period.start, period.end],
            //         [overlap.start, overlap.end]
            //       ],
            //   period.location
            // )
            break
          }
          profs[profName].push(period)
        }
      }
    }
  }

  // console.log(Object.values(courses).length)
  // console.log(
  //   Object.values(courses).reduce(
  //     (cum, curr) =>
  //       cum +
  //       curr.groups.reduce(
  //         (cum, curr) =>
  //           cum +
  //           curr.sections.length +
  //           curr.meetings.length +
  //           curr.exams.length,
  //         0
  //       ),
  //     0
  //   )
  // )
}
