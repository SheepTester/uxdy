import {
  Meeting,
  Exam,
  MeetingTime,
  Course
} from '../../scheduleofclasses/group-sections.ts'
import { Time } from '../../util/Time.ts'

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

export function coursesFromFile (file: string): Course[] {
  const courses: Course[] = []
  const state: ('sections' | 'meetings' | 'exams')[] = []
  const lines = file.trim().split(/\r?\n/)
  if (lines.shift() !== 'V2') {
    throw new CourseFormatError(
      "I don't understand the format the courses are in."
    )
  }
  for (const line of lines) {
    const taker = new StringTaker(line)
    if (line.startsWith('\t')) {
      taker.discard(1)
      const course = courses[courses.length - 1]
      const group = course.groups[course.groups.length - 1]
      const nextState = state.shift()
      if (nextState === 'sections') {
        while (taker.hasMore()) {
          const capacity = taker.takeInt(4)
          group.sections.push({
            code: taker.take(3),
            capacity: capacity === 9999 ? Infinity : capacity,
            ...taker.takeMeeting()
          })
        }
      } else if (nextState === 'meetings') {
        while (taker.hasMore()) {
          group.meetings.push(taker.takeMeeting())
        }
      } else if (nextState === 'exams') {
        while (taker.hasMore()) {
          const date = new Date(
            Date.UTC(taker.takeInt(4), taker.takeInt(2) - 1, taker.takeInt(2))
          )
          group.exams.push({
            date,
            ...taker.takeMeeting(date.getUTCDay())
          })
        }
      } else {
        const additionalMeetings = taker.takeInt(1)
        state.push('sections')
        if (additionalMeetings & 0b10) {
          state.push('meetings')
        }
        if (additionalMeetings & 0b01) {
          state.push('exams')
        }
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
          exams: []
        })
      }
    } else {
      courses.push({
        code: [taker.take(4), taker.take(5)].join(' '),
        title: taker.takeRest(),
        groups: []
      })
    }
  }
  return courses
}

export function compareRoomNums (a: string, b: string): number {
  const aBasement = a.startsWith('B')
  const bBasement = b.startsWith('B')
  if (aBasement !== bBasement) {
    // Sort basement before other levels
    return aBasement ? -1 : 1
  } else {
    // Reverse ordering for basement levels so that B2xx comes before B1xx
    return aBasement ? b.localeCompare(a) : a.localeCompare(b)
  }
}

// Omit<Meeting | Exam, 'time' | 'location'> does not work with type narrowing
// with `'date' in meeting`
export type RoomMeeting = (
  | Omit<Meeting, 'time' | 'location'>
  | Omit<Exam, 'time' | 'location'>
) &
  MeetingTime<Time> & {
    capacity: number
    course: string
    index: {
      group: number
      meeting: number
      type: 'section' | 'meeting' | 'exam'
    }
  }

export type Building = {
  name: string
  rooms: Record<string, RoomMeeting[]>
}

if (import.meta.main) {
  console.log(coursesFromFile(await Deno.readTextFile(Deno.args[0]))[100])
}
