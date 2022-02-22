/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { RoomMeeting } from '../from-file.ts'
import { Now } from '../now.ts'

const DAYS = [7, 1, 2, 3, 4, 5, 6]
const WEEKDAYS = [1, 2, 3, 4, 5]
const DAY_NAMES = ['', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
const SCALE = 1 // px per min

type BuildingProps = {
  now: Now
  meetings: RoomMeeting[]
}
export function Schedule ({ meetings }: BuildingProps) {
  const hasWeekend = meetings.some(
    meeting => meeting.days.includes(6) || meeting.days.includes(7)
  )
  const earliest = meetings.reduce(
    (acc, curr) => Math.min(acc, curr.start.valueOf()),
    Infinity
  )
  const latest = meetings.reduce(
    (acc, curr) => Math.max(acc, curr.end.valueOf()),
    -Infinity
  )

  return (
    <div class='schedule'>
      <div class='day-names'>
        {(hasWeekend ? DAYS : WEEKDAYS).map(day => (
          <div class='day day-name' key={day}>
            {DAY_NAMES[day]}
          </div>
        ))}
      </div>
      <div class='gradient gradient-top'></div>
      <div class='meetings-wrapper'>
        {(hasWeekend ? DAYS : WEEKDAYS).map(day => (
          <div
            class='day meetings'
            key={day}
            style={{ height: `${(latest - earliest) / SCALE}px` }}
          >
            {meetings
              .filter(meeting => meeting.days.includes(day))
              .map(meeting => (
                <div
                  class='meeting'
                  style={{
                    top: `${(meeting.start.valueOf() - earliest) / SCALE}px`,
                    height: `${
                      (meeting.end.valueOf() - meeting.start.valueOf()) / SCALE
                    }px`
                  }}
                >
                  <div class='meeting-name'>
                    {meeting.course} ({meeting.type})
                  </div>
                  <div class='meeting-time'>
                    {meeting.start.toString()}–{meeting.end.toString()}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
      <div class='gradient gradient-bottom'></div>
    </div>
  )
}
