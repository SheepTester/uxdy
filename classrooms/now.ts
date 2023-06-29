import { useEffect, useState } from 'preact/hooks'
import { Time } from '../util/Time.ts'
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

/**
 * @param includeBefore Minutes before the meeting to consider as part of the
 * meeting. Useful to determine if a meeting will occur soon but not right now.
 * @returns a predicate that searches for a meeting that is occuring at the
 * given time, to determine whether a room is being used.
 */
export function used (
  { day, time }: Now,
  includeBefore = 0
): (meeting: RoomMeeting) => boolean {
  return meeting => {
    return (
      meeting.days.includes(day) &&
      +meeting.start - includeBefore <= +time &&
      time < meeting.end
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
        return now.day === newNow.day && +now.time === +newNow.time
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
