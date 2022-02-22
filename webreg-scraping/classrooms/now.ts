import { useEffect, useState } from 'https://esm.sh/preact@10.6.6/hooks'
import { Time } from '../util/time.ts'
import { RoomMeeting } from './from-file.ts'

export type Now = {
  day: number
  time: Time
}

function getNow (): Now {
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

export function useNow (): Now {
  const [now, setNow] = useState(() => getNow())
  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(now => {
        const newNow = getNow()
        // Return old object if time hasn't changed to avoid rerender
        return now.day === newNow.day &&
          now.time.valueOf() === newNow.time.valueOf()
          ? now
          : newNow
      })
    }, 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [])
  return now
}
