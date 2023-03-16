import {
  Course,
  Exam,
  Meeting,
  Section
} from '../../scheduleofclasses/group-sections.ts'

class StringTaker {
  #string: string
  #index = 0

  constructor (string: string) {
    this.#string = string
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

  takeMeeting (time = true): Meeting {
    const type = this.take(2)
    const building = this.take(5)
    const room = this.take(5)
    const days = time ? this.take(5) : ''
    if (days === 'TBA') {
      this.take(8)
    }
    return {
      type,
      location: building === 'TBA' ? null : { building, room },
      time:
        days === 'TBA'
          ? {
              days: Array.from(days, Number),
              start: this.#takeMinutes(),
              end: this.#takeMinutes()
            }
          : null
    }
  }

  hasMore (): boolean {
    return this.#index < this.#string.length
  }
}

export function coursesFromFile (file: string): Course[] {
  const courses: Course[] = []
  const state: ('sections' | 'meetings' | 'exams')[] = []
  for (const line of file.trim().split(/\r?\n/)) {
    const taker = new StringTaker(line)
    if (line.startsWith('\t')) {
      taker.take(1)
      const course = courses[courses.length - 1]
      const group = course.groups[course.groups.length - 1]
      const nextState = state.pop()
      if (nextState === 'sections') {
        while (taker.hasMore()) {
          const code = taker.take(3)
          const capacity = taker.takeInt(4)
          group.sections.push({
            code,
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
          group.exams.push({
            ...taker.takeMeeting(),
            date: new Date(
              Date.UTC(taker.takeInt(4), taker.takeInt(2) - 1, taker.takeInt(2))
            )
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

export type RoomMeeting = (Meeting | Exam) & {
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

export function coursesToClassrooms (courses: Course[]): Building[] {
  const buildings: Record<string, Building> = {}
  for (const [i, { code, groups }] of courses.entries()) {
    for (const [j, { sections, meetings, exams }] of groups.entries()) {
      const groupCapacity = sections.reduce(
        (cum, curr) => cum + curr.capacity,
        0
      )
      const allMeetings: (Section | Meeting | Exam)[] = [
        ...sections,
        ...meetings,
        ...exams
      ]
      for (const meeting of allMeetings) {
        const { location } = meeting
        if (!location || location.building === 'RCLAS') {
          continue
        }
        buildings[location.building] ??= { name: location.building, rooms: {} }
        buildings[location.building].rooms[location.room] ??= []
        buildings[location.building].rooms[location.room].push({
          ...meeting,
          capacity: 'capacity' in meeting ? meeting.capacity : groupCapacity,
          course: code,
          index: {
            group: i,
            meeting: j,
            type:
              'capacity' in meeting
                ? 'section'
                : 'date' in meeting
                ? 'exam'
                : 'meeting'
          }
        })
      }
    }
  }
  return Object.values(buildings)
}

if (import.meta.main) {
  console.log(coursesFromFile(await Deno.readTextFile(Deno.args[0]))[100])
}
