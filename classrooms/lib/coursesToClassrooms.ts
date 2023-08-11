import {
  Meeting,
  Exam,
  Course,
  Section,
  MeetingTime
} from '../../scheduleofclasses/group-sections.ts'
import { Day } from '../../util/Day.ts'
import { Time } from '../../util/Time.ts'

// Omit<Meeting | Exam, 'time' | 'location'> does not work with type narrowing
// with `'date' in meeting`
export type RoomMeeting = Omit<Section | Meeting | Exam, 'time' | 'location'> &
  MeetingTime<Time> & {
    capacity: number
    course: string
    index: {
      group: number
      meeting: number
    }
  }

export type TermBuildings = Record<string, Record<string, RoomMeeting[]>>

/**
 * Allows more context for what meetings to show. By default, this only shows
 * regular meetings, such as lectures, and won't include single-day meetings
 * such as midterms and finals.
 */
export type CoursesToClassroomsOptions = {
  /**
   * Whether it's finals week. If so, regular meetings (e.g. lectures) won't be
   * included. Default: false.
   */
  finals?: boolean
  /**
   * The Monday of the current week. By WebReg convention, weeks start on
   * Mondays. This will include exams from the given Monday to the following
   * Sunday. If omitted, exams will not be included.
   */
  monday?: Day
}

export function coursesToClassrooms (
  courses: Course[],
  { finals = false, monday }: CoursesToClassroomsOptions = {}
): TermBuildings {
  const nextMonday = monday?.add(7)
  const buildings: TermBuildings = {}
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
        const { location, time } = meeting
        if (!time || !location || location.building === 'RCLAS') {
          continue
        }
        if (meeting.kind === 'exam') {
          // Exam
          if (
            !monday ||
            !nextMonday ||
            meeting.date < monday ||
            meeting.date >= nextMonday
          ) {
            continue
          }
        } else if (finals) {
          // Omit regular meetings during finals week
          continue
        }
        buildings[location.building] ??= {}
        buildings[location.building][location.room] ??= []
        buildings[location.building][location.room].push({
          ...meeting,
          days: time.days,
          start: Time.from(time.start),
          end: Time.from(time.end),
          capacity:
            meeting.kind === 'section' ? meeting.capacity : groupCapacity,
          course: code,
          index: {
            group: i,
            meeting: j
          }
        })
      }
    }
  }
  return buildings
}
