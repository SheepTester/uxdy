import {
  Meeting,
  Exam,
  Course,
  Section,
  MeetingTime
} from '../../scheduleofclasses/group-sections.ts'
import { getHolidays } from '../../terms/holidays.ts'
import { Day } from '../../util/Day.ts'
import { Time } from '../../util/Time.ts'

export type RoomMeeting = Omit<Section | Meeting | Exam, 'time' | 'location'> &
  MeetingTime<Time> & {
    capacity: number
    course: string
    index: {
      group: number
      meeting: number
    }
    /** Whether the course is from Special Summer Session. */
    special: boolean
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
   * Sunday. If omitted, exams will not be included, and S3 is assumed to always
   * occur.
   */
  monday: Day
}

export function coursesToClassrooms (
  courses: Course[],
  { finals = false, monday }: CoursesToClassroomsOptions
): TermBuildings {
  const holidays = getHolidays(monday.year)
  const nextMonday = monday.add(7)
  const buildings: TermBuildings = {}
  for (const [i, { code, groups }] of courses.entries()) {
    for (const [
      j,
      { sections, meetings, exams, dateRange }
    ] of groups.entries()) {
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
          if (meeting.date < monday || meeting.date >= nextMonday) {
            continue
          }
        } else if (finals) {
          // Omit regular meetings during finals week
          continue
        }
        const days = time.days.filter(weekday => {
          const day = monday.add((weekday + 6) % 7)
          if (holidays[day.id]) {
            return false
          }
          if (dateRange && meeting.kind !== 'exam') {
            return dateRange.start <= day && day <= dateRange.end
          }
          return true
        })
        if (days.length === 0) {
          continue
        }
        buildings[location.building] ??= {}
        buildings[location.building][location.room] ??= []
        buildings[location.building][location.room].push({
          ...meeting,
          days,
          start: Time.from(time.start),
          end: Time.from(time.end),
          capacity:
            meeting.kind === 'section' ? meeting.capacity : groupCapacity,
          course: code,
          index: {
            group: i,
            meeting: j
          },
          special: dateRange !== undefined && meeting.kind !== 'exam'
        })
      }
    }
  }
  return buildings
}
