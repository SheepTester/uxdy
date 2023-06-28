/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { meetingTypes } from '../../webreg-scraping/meeting-types.ts'
import { RoomMeeting } from '../from-file.ts'
import { Now } from '../now.ts'

const DAYS = [1, 2, 3, 4, 5, 6, 7]
const WEEKDAYS = [1, 2, 3, 4, 5]
const DAY_NAMES = ['', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
const SCALE = 1 // px per min

type BuildingProps = {
  now?: Now | null
  meetings: RoomMeeting[]
}
export function Schedule ({ now, meetings }: BuildingProps) {
  const [day, setDay] = useState<number | null>(null)

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

  return (
    <div class='schedule'>
      <div class='day-names'>
        {(hasWeekend ? DAYS : WEEKDAYS).map(weekDay => (
          <button
            class={`day day-name ${weekDay === day ? 'selected-day' : ''}`}
            key={weekDay}
            onClick={() => setDay(day => (weekDay === day ? null : weekDay))}
          >
            {DAY_NAMES[weekDay]}
          </button>
        ))}
      </div>
      <div class='gradient gradient-top'></div>
      <div class={`meetings-wrapper ${day === null ? 'full-week' : ''}`}>
        {(day !== null ? [day] : hasWeekend ? DAYS : WEEKDAYS).map(day => (
          <div
            class='day meetings'
            key={day}
            style={{ height: `${(latest - earliest) / SCALE}px` }}
          >
            {meetings
              .filter(meeting => meeting.days.includes(day))
              .map(meeting => (
                <div
                  class={`meeting ${
                    now?.day === day &&
                    meeting.start <= now.time &&
                    now.time < meeting.end
                      ? 'current'
                      : ''
                  } ${'date' in meeting ? 'exam' : ''}`}
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
                    {meeting.start.toString()}–{meeting.end.toString()}
                  </div>
                </div>
              ))}
            {now?.day === day && earliest <= +now.time && +now.time < latest && (
              <div
                class='now'
                style={{
                  top: `${(+now.time - earliest) / SCALE}px`
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div class='gradient gradient-bottom'></div>
      <p class='disclaimer'>Note: some classes book rooms but don't meet.</p>
    </div>
  )
}
