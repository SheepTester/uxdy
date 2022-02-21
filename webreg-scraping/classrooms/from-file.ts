import { Time } from '../util/time.ts'

export type Meeting = {
  type: string
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
            .matchAll(/(.{2})(.{5})(.{5})([1-7 ]{5})(\d\d)(\d\d)(\d\d)(\d\d)/g),
          ([
            ,
            type,
            building,
            room,
            days,
            startHour,
            startMinute,
            endHour,
            endMinute
          ]) => ({
            type,
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

export function coursesToClassrooms (courses: Course[]): Building[] {
  const buildings: Record<string, Building> = {}
  for (const { subject, course: courseCode, meetings } of courses) {
    const course = `${subject} ${courseCode}`
    for (const { building, room, type, days, start, end } of meetings) {
      buildings[building] ??= { name: building, rooms: {} }
      buildings[building].rooms[room] ??= []
      buildings[building].rooms[room].push({ course, type, days, start, end })
    }
  }
  return Object.values(buildings)
}
