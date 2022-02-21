import { Time } from '../util/time.ts'
import { RoomMeeting } from './from-file.ts'

export type Now = {
  day: number
  time: Time
}

export function now (): Now {
  const now = new Date()
  return {
    day: now.getDay(),
    time: new Time(now.getHours(), now.getMinutes())
  }
}

export function used ({ day, time }: Now): (meeting: RoomMeeting) => boolean {
  return meeting => {
    return (
      meeting.days.includes(day) && meeting.start <= time && time < meeting.end
    )
  }
}
