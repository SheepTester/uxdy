import { Meeting, Course } from '../../scheduleofclasses/group-sections.ts'
import { Day } from '../../util/Day.ts'

class StringTaker {
  #string: string
  #index = 0

  constructor (string: string) {
    this.#string = string
  }

  /** IMPURE. */
  discard (chars: number): null {
    this.#index += chars
    return null
  }

  /** IMPURE. Trims string. */
  take (chars: number): string {
    this.#index += chars
    return this.#string.slice(this.#index - chars, this.#index).trim()
  }

  /** IMPURE. */
  takeInt (chars: number): number {
    return +this.take(chars)
  }

  takeRest (): string {
    return this.#string.slice(this.#index)
  }

  #takeMinutes (): number {
    const time = this.take(4)
    return +time.slice(0, 2) * 60 + +time.slice(2)
  }

  /** IMPURE. */
  takeMeeting (day: number | null = null): Meeting {
    const building = this.take(5)
    const days = day === null ? this.take(5) : String(day)
    return {
      type: this.take(2),
      location:
        building === 'TBA' ? this.discard(5) : { building, room: this.take(5) },
      time:
        days !== 'TBA'
          ? {
              days: Array.from(days, Number),
              start: this.#takeMinutes(),
              end: this.#takeMinutes()
            }
          : this.discard(8)
    }
  }

  hasMore (): boolean {
    return this.#index < this.#string.length
  }
}

export class CourseFormatError extends SyntaxError {
  name = this.constructor.name
}

export type TermCourses = {
  scraped: Date
  courses: Course[]
}

type State =
  | { type: 'course-or-group' }
  | {
      type: 'sections'
      hasMeetings: boolean
      hasExams: boolean
    }
  | { type: 'meetings'; hasExams: boolean }
  | { type: 'exams' }

export function coursesFromFile (
  file: string,
  includeDateRange = false
): TermCourses {
  const courses: Course[] = []
  let state: State = { type: 'course-or-group' }
  const lines = file.trim().split(/\r?\n/)
  const metadata = new StringTaker(lines.shift() ?? '')
  if (metadata.take(2) !== 'V3') {
    throw new CourseFormatError(
      "I don't understand the format the courses are in."
    )
  }
  const scraped = new Date(+metadata.takeRest())
  for (const line of lines) {
    const taker = new StringTaker(line)
    const course = courses[courses.length - 1]
    const group = course?.groups[course.groups.length - 1]
    if (state.type === 'course-or-group') {
      if (/^[A-Z]/.test(line)) {
        // Course
        const code = [taker.take(4), taker.take(5)].join(' ')
        const dateRange: [Day, Day] | undefined = includeDateRange
          ? [
              Day.from(taker.takeInt(4), taker.takeInt(2), taker.takeInt(2)),
              Day.from(taker.takeInt(4), taker.takeInt(2), taker.takeInt(2))
            ]
          : undefined
        const [title, catalog] = taker.takeRest().split('\t')
        courses.push({
          code,
          title,
          catalog,
          dateRange,
          groups: []
        })
      } else {
        // Group
        const additionalMeetings = taker.take(1)
        course.groups.push({
          code: taker.take(3),
          instructors: taker
            .takeRest()
            .split('\t')
            .map(name => {
              const [first, last] = name.split(',')
              return [first, last]
            }),
          sections: [],
          meetings: [],
          exams: [],
          coscheduled: [] // TODO
        })
        state = {
          type: 'sections',
          hasMeetings: additionalMeetings === ':' || additionalMeetings === '.',
          hasExams: additionalMeetings === ':' || additionalMeetings === "'"
        }
      }
    } else if (state.type === 'sections') {
      while (taker.hasMore()) {
        const capacity = taker.takeInt(4)
        group.sections.push({
          capacity: capacity === 9999 ? Infinity : capacity,
          ...taker.takeMeeting(),
          code: taker.take(3) || group.code
        })
      }
      state = state.hasMeetings
        ? { type: 'meetings', hasExams: state.hasExams }
        : state.hasExams
        ? { type: 'exams' }
        : { type: 'course-or-group' }
    } else if (state.type === 'meetings') {
      while (taker.hasMore()) {
        group.meetings.push(taker.takeMeeting())
      }
      state = state.hasExams ? { type: 'exams' } : { type: 'course-or-group' }
    } else if (state.type === 'exams') {
      while (taker.hasMore()) {
        const date = Day.from(
          taker.takeInt(4),
          taker.takeInt(2),
          taker.takeInt(2)
        )
        group.exams.push({
          date,
          ...taker.takeMeeting(date.day)
        })
      }
      state = { type: 'course-or-group' }
    }
  }
  return { scraped, courses }
}

if (import.meta.main) {
  console.log(
    coursesFromFile(await Deno.readTextFile(Deno.args[0])).courses[100]
  )
}
