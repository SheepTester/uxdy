// deno run --allow-read scheduleofclasses/group-sections.ts SP23
// Prints list of remote sections.

import { Day } from '../util/Day.ts'
import { getCourses, readCourses, ScrapedResult } from './scrape.ts'

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
export type Meeting = {
  type: string
  /** Null if TBA. */
  time: MeetingTime | null
  /** Null if TBA. */
  location: {
    building: string
    room: string
  } | null
}
export type Section = Meeting & {
  code: string
  capacity: number
}
export type Exam = Meeting & {
  /** UTC Date. */
  date: Day
}
export type Group = {
  /** The section code for the lecture in charge of the group, eg A00 or 001. */
  code: string
  /** Individual sections where students have to select one to enroll in. */
  sections: Section[]
  /** Additional meetings, such as a lecture, that all sections share. */
  meetings: Meeting[]
  /** Exams, such as finals, that meet on a specific day. */
  exams: Exam[]
  /** Empty if taught by Staff. */
  instructors: [firstName: string, lastName: string][]
}
export type Course = {
  /** The subject and number, joined by a space, eg "CSE 11." */
  code: string
  title: string
  catalog?: string
  dateRange?: [Day, Day]
  groups: Group[]
}

export function groupSections (result: ScrapedResult): Record<string, Course> {
  const courses: Record<string, Course> = {}
  for (const course of result.courses) {
    const groups: Record<string, Group> = {}
    let lastGroup: Group | null = null
    for (const section of course.sections) {
      const meeting: Meeting = {
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
        instructors: section.instructors
      }
      lastGroup = groups[letter]

      if (section.selectable) {
        groups[letter].sections.push({
          ...meeting,
          code: section.section,
          capacity: section.selectable.capacity
        })
      } else {
        groups[letter].meetings.push(meeting)
      }
    }

    const code = `${course.subject} ${course.number}`
    courses[code] = {
      code,
      title: course.title,
      catalog: course.catalog,
      dateRange: course.dateRange
        ? [Day.from(...course.dateRange[0]), Day.from(...course.dateRange[1])]
        : undefined,
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

  // const starts = Math.min(
  //   ...result.courses.flatMap(course =>
  //     course.dateRange ? [Day.from(...course.dateRange[0]).id] : []
  //   )
  // )
  // const ends = Math.max(
  //   ...result.courses.flatMap(course =>
  //     course.dateRange ? [Day.from(...course.dateRange[0]).id] : []
  //   )
  // )
  // - S323: 2023-06-19 2023-09-08 -> no overlap with SP or FA (but it can start
  //   before S123)
  // - SU23: 2023-05-09 2023-06-26 -> overlap with SP !! but for some reason,
  //   all their locations are TBA, so I could omit it from the app
  // - SU18: 2018-05-14 2018-07-02
  // console.log(Day.fromId(starts), Day.fromId(ends))
  const courses = groupSections(result)

  // printRemoteSections(courses)

  type Period = {
    day: number
    start: number
    end: number
    note: string
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
      const profName = group.instructors.map(name => name.join(' ')).join(', ')
      profs[profName] ??= []
      // DI sections can overlap. I guess we can assume that professors don't
      // attend sections unless it's the only meetings of the course?
      for (const meeting of group.meetings.length > 0
        ? group.meetings
        : group.sections) {
        if (!meeting.time) {
          continue
        }
        for (const day of meeting.time.days) {
          const period = {
            day,
            start: meeting.time.start,
            end: meeting.time.end,
            note: `${course.code} ${
              'code' in meeting ? meeting.code : group.code
            } ${meeting.type}`
          }
          const overlap = findOverlap(profs[profName], period)
          if (overlap) {
            console.log(profName, period.note, 'overlaps with', overlap.note)
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
