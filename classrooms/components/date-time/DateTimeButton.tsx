/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { getTerm, termCode } from '../../../terms/index.ts'
import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'

const dateFormat = new Intl.DateTimeFormat([], {
  dateStyle: 'short',
  timeStyle: 'short'
})

export type DateTimeButtonProps = {
  date: Day
  time: Time
  onClick: () => void
  bottomPanelOpen: boolean
  disabled: boolean
}
export function DateTimeButton ({
  date,
  time,
  onClick,
  bottomPanelOpen,
  disabled
}: DateTimeButtonProps) {
  const { year, season, current, week } = getTerm(date)
  return (
    <button
      class={`date-time-button ${bottomPanelOpen ? 'bottom-panel-open' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <p class='showing-schedule-wrapper'>
        <span class='showing-schedule-text'>Showing schedule for</span>
        <div class='date-time'>
          {dateFormat.format(
            new Date(date.year, date.month, date.date, time.hour, time.minute)
          )}
        </div>
        {current && (
          <span class='quarter-week'>
            {termCode(year, season)} {week < 10 ? `Week ${week}` : 'Finals'}{' '}
            {date.dayName('short')}
          </span>
        )}
      </p>
      <div class='icon-btn edit-icon'>Edit</div>
    </button>
  )
}
