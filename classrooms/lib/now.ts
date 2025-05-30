import { Day } from '../../util/Day.ts'
import { Time } from '../../util/Time.ts'

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

export function now (): Moment {
  return toPT(new Date())
}
