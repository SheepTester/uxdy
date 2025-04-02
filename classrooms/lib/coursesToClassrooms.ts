import {
  Meeting,
  Exam,
  Course,
  Section,
  MeetingTime
} from '../../scheduleofclasses/group-sections.ts'

export type RoomMeeting = (
  | Omit<Section, 'location'>
  | Omit<Meeting, 'location'>
  | Omit<Exam, 'location'>
) & {
  time: MeetingTime
  capacity: number
  course: string
  index: {
    group: number
    meeting: number
  }
  /** Whether the course is from Special Summer Session. */
  special: boolean
}

/** Maps building code -> room number -> meetings. */
export type TermBuildings = Record<string, Record<string, RoomMeeting[]>>

export function coursesToClassrooms (courses: Course[]): TermBuildings {
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
        if (time.days.length === 0) {
          continue
        }
        buildings[location.building] ??= {}
        buildings[location.building][location.room] ??= []
        buildings[location.building][location.room].push({
          ...meeting,
          time,
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
