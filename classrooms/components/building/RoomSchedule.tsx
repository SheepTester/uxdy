/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'
import { meetingTypes } from '../../../webreg-scraping/meeting-types.ts'
import { RoomMeeting } from '../../lib/coursesToClassrooms.ts'
import { Link } from '../Link.tsx'
import {
  doesMeetingHappen,
  isMeetingOngoing,
  useMoment
} from '../../moment-context.ts'

const DAYS = [1, 2, 3, 4, 5, 6, 7]
const WEEKDAYS = [1, 2, 3, 4, 5]
const SCALE = 1 // px per min

export type RoomScheduleProps = {
  meetings: RoomMeeting[]
}
export function RoomSchedule ({ meetings }: RoomScheduleProps) {
  const moment = useMoment()
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

  const actualMeetings = Object.fromEntries(
    DAYS.map(day => [
      day,
      meetings.filter(meeting =>
        doesMeetingHappen(
          meeting,
          moment, // WebReg weeks start on Monday
          moment.date.monday.add(day - 1),
          meeting.special
        )
      )
    ])
  )
  const hasWeekend =
    actualMeetings[6].length > 0 || actualMeetings[7].length > 0
  const filteredMeetings =
    day !== null ? actualMeetings[day] : Object.values(actualMeetings).flat()
  const earliest = filteredMeetings.reduce(
    (acc, curr) => Math.min(acc, +curr.time.start),
    Infinity
  )
  const latest = filteredMeetings.reduce(
    (acc, curr) => Math.max(acc, +curr.time.end),
    -Infinity
  )

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
        {(day !== null ? [day] : hasWeekend ? DAYS : WEEKDAYS).map(day => {
          const holiday = moment.holidays[moment.date.monday.add(day - 1).id]
          return (
            <div
              class={`day meetings ${holiday ? 'has-holiday' : ''}`}
              key={day}
              style={{ height: `${(latest - earliest) / SCALE}px` }}
            >
              {holiday ? (
                <p class='schedule-holiday-notice'>{holiday}</p>
              ) : null}
              {actualMeetings[day]
                .sort((a, b) => +a.time.start - +b.time.start)
                .map(meeting => (
                  <Link
                    view={{ type: 'course', course: meeting.course }}
                    class={`meeting ${
                      isMeetingOngoing(meeting, moment) ? 'current' : ''
                    } ${meeting.kind === 'exam' ? 'exam' : ''}`}
                    style={{
                      top: `${(+meeting.time.start - earliest) / SCALE}px`,
                      height: `${
                        (+meeting.time.end - +meeting.time.start) / SCALE
                      }px`
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
                      {meeting.time.start.formatRange(meeting.time.end)}
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
              {moment.date.day === day &&
                earliest <= +moment.time &&
                +moment.time < latest && (
                  <div
                    class='now'
                    style={{
                      top: `${(+moment.time - earliest) / SCALE}px`
                    }}
                  />
                )}
            </div>
          )
        })}
      </div>
      <footer class='disclaimer-wrapper'>
        <div class='gradient gradient-bg gradient-bottom' />
        <p class='disclaimer'>Note: some classes book rooms but don't meet.</p>
      </footer>
    </div>
  )
}
