import { Time } from '../util/time.ts'

export type Meeting = {
  capacity: number | null
  days: number[]
  start: Time
  end: Time
}

export type CourseMeeting = Meeting & {
  building: string
  room: string
}

export type Course = {
  subject: string
  course: string
  meetings: CourseMeeting[]
}

export function coursesFromFile (file: string): Course[] {
  return file
    .trim()
    .split(/\r?\n/)
    .map(course => {
      const subject = course.slice(0, 4)
      const courseCode = course.slice(4, 9)
      return {
        subject,
        course: courseCode,
        meetings: Array.from(
          course
            .slice(9)
            .matchAll(
              /(\d{4})(.{5})(.{5})([1-7 ]{5})(\d\d)(\d\d)(\d\d)(\d\d)/g
            ),
          ([
            ,
            capacity,
            building,
            room,
            days,
            startHour,
            startMinute,
            endHour,
            endMinute
          ]) => ({
            capacity: capacity === '9999' ? null : +capacity,
            building: building.trim(),
            room: room.trim(),
            days: days.trim().split('').map(Number),
            start: new Time(+startHour, +startMinute),
            end: new Time(+endHour, +endMinute)
          })
        )
      }
    })
}

export type RoomMeeting = Meeting & { course: string }

export type Building = {
  name: string
  rooms: Record<string, RoomMeeting[]>
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

export function coursesToClassrooms (courses: Course[]): Building[] {
  const buildings: Record<string, Building> = {}
  for (const { subject, course: courseCode, meetings } of courses) {
    const course = `${subject} ${courseCode}`
    for (const { building, room, capacity, days, start, end } of meetings) {
      buildings[building] ??= { name: building, rooms: {} }
      buildings[building].rooms[room] ??= []
      buildings[building].rooms[room].push({
        course,
        capacity,
        days,
        start,
        end
      })
    }
  }
  return Object.values(buildings)
}
