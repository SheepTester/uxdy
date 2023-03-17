import { assert } from 'https://deno.land/std@0.178.0/testing/asserts.ts'
import { Course as ScrapedCourse, readCourses } from './scrape.ts'

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
  date: Date
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
  groups: Group[]
}

export function groupSections (
  scrapedCourses: ScrapedCourse[]
): Record<string, Course> {
  const courses: Record<string, Course> = {}
  for (const course of scrapedCourses) {
    const groups: Record<string, Group> = {}
    let lastGroup: Group | null = null
    for (const section of course.sections) {
      const meeting: Meeting = {
        type: section.type,
        time: section.time,
        location: section.location
      }

      if (section.section instanceof Date) {
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
      if (isLetter && !groups[letter]) {
        // A00 should be first
        assert(section.section.endsWith('00'))
      }
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
      groups: Object.values(groups)
    }
  }
  return courses
}

if (import.meta.main) {
  const term = 'SP23'

  const scrapedCourses: ScrapedCourse[] = await readCourses(
    `./scheduleofclasses/terms/${term}.json`
  )
  const courses = groupSections(scrapedCourses)
  console.log(courses['CAT 125'])
}
