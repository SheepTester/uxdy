/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'
import { meetingTypes } from '../../../webreg-scraping/meeting-types.ts'
import { RoomMeeting } from '../../lib/coursesToClassrooms.ts'
import { used } from '../../lib/now.ts'
import { Link } from '../Link.tsx'

const DAYS = [1, 2, 3, 4, 5, 6, 7]
const WEEKDAYS = [1, 2, 3, 4, 5]
const SCALE = 1 // px per min

export type RoomScheduleProps = {
  weekday: number
  time: Time
  meetings: RoomMeeting[]
}
export function RoomSchedule ({ weekday, time, meetings }: RoomScheduleProps) {
  const [day, setDay] = useState<number | null>(null)

  if (meetings.length === 0) {
    return (
      <div class='empty'>
        <p>
          This room isn't used for any classes this week, as far as WebReg is
          concerned.
        </p>
      </div>
    )
  }

  const hasWeekend = meetings.some(
    meeting => meeting.days.includes(6) || meeting.days.includes(7)
  )
  const earliest = meetings.reduce(
    (acc, curr) => Math.min(acc, +curr.start),
    Infinity
  )
  const latest = meetings.reduce(
    (acc, curr) => Math.max(acc, +curr.end),
    -Infinity
  )

  const inUse = used(weekday, time)

  return (
    <div class='schedule'>
      <div class='day-names-wrapper'>
        <div class='gradient gradient-bg gradient-top' />
        <div class='day-names'>
          {(hasWeekend ? DAYS : WEEKDAYS).map(weekDay => (
            <button
              class={`day day-name ${weekDay === day ? 'selected-day' : ''}`}
              key={weekDay}
              onClick={() => setDay(day => (weekDay === day ? null : weekDay))}
            >
              {Day.dayName(weekDay, 'short')}
            </button>
          ))}
        </div>
      </div>
      <div class={`meetings-wrapper ${day === null ? 'full-week' : ''}`}>
        {(day !== null ? [day] : hasWeekend ? DAYS : WEEKDAYS).map(day => (
          <div
            class='day meetings'
            key={day}
            style={{ height: `${(latest - earliest) / SCALE}px` }}
          >
            {meetings
              .filter(meeting => meeting.days.includes(day))
              .sort((a, b) => +a.start - +b.start)
              .map(meeting => (
                <Link
                  view={{ type: 'course', course: meeting.course }}
                  class={`meeting ${inUse(meeting) ? 'current' : ''} ${
                    meeting.kind === 'exam' ? 'exam' : ''
                  }`}
                  style={{
                    top: `${(+meeting.start - earliest) / SCALE}px`,
                    height: `${(+meeting.end - +meeting.start) / SCALE}px`
                  }}
                >
                  <div class='meeting-name'>
                    {meeting.course} (
                    <abbr title={meetingTypes[meeting.type]}>
                      {meeting.type}
                    </abbr>
                    )
                  </div>
                  <div class='meeting-time'>
                    {meeting.start.formatRange(meeting.end)}
                  </div>
                  {meeting.special && (
                    <abbr
                      class='special-summer'
                      title='This meeting is from a Special Summer Session course.'
                    >
                      S3
                    </abbr>
                  )}
                </Link>
              ))}
            {weekday === day && earliest <= +time && +time < latest && (
              <div
                class='now'
                style={{
                  top: `${(+time - earliest) / SCALE}px`
                }}
              />
            )}
          </div>
        ))}
      </div>
      <footer class='disclaimer-wrapper'>
        <div class='gradient gradient-bg gradient-bottom' />
        <p class='disclaimer'>Note: some classes book rooms but don't meet.</p>
      </footer>
    </div>
  )
}
