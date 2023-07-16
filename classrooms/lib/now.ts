import { useEffect, useState } from 'preact/hooks'
import { Day } from '../../util/Day.ts'
import { Time } from '../../util/Time.ts'
import { RoomMeeting } from './coursesToClassrooms.ts'

export type Moment = {
  date: Day
  time: Time
}

// https://github.com/Orbiit/gunn-web-app/blob/master/js/utils.js
const TIME_ZONE = 'America/Los_Angeles'

export function inPT (): boolean {
  const { timeZone } = new Intl.DateTimeFormat().resolvedOptions()
  return timeZone === TIME_ZONE
}

function toPT (date: Date): Moment {
  const string = date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE
  })
  const match = string.match(/^(\d\d)\/(\d\d)\/(\d{4}), (\d\d):(\d\d) ([AP]M)$/)
  if (match) {
    return {
      date: Day.from(+match[3], +match[1], +match[2]),
      time: new Time(
        match[4] === '12'
          ? match[6] === 'AM'
            ? 0
            : 12
          : +match[4] + (match[6] === 'PM' ? 12 : 0),
        +match[5]
      )
    }
  } else {
    // Fall back to local time instead of outright failing
    console.warn(string, 'did not match expected PT format.')
    return {
      date: Day.fromLocal(date),
      time: new Time(date.getHours(), date.getMinutes())
    }
  }
}

function getNow (): Moment {
  return toPT(new Date())
}

/**
 * @param includeBefore Minutes before the meeting to consider as part of the
 * meeting. Useful to determine if a meeting will occur soon but not right now.
 * @returns a predicate that searches for a meeting that is occuring at the
 * given time, to determine whether a room is being used.
 */
export function used (
  weekday: number,
  time: Time,
  includeBefore = 0
): (meeting: RoomMeeting) => boolean {
  return meeting => {
    return (
      meeting.days.includes(weekday) &&
      +meeting.start - includeBefore <= +time &&
      time < meeting.end
    )
  }
}

export function useNow (): Moment {
  const [now, setNow] = useState(() => getNow())
  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(now => {
        const newNow = getNow()
        // Return old object if time hasn't changed to avoid rerender
        return +now.date === +newNow.date && +now.time === +newNow.time
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
