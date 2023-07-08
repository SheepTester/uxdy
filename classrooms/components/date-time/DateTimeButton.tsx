/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { getTerm, termCode } from '../../../terms/index.ts'
import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'

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
          <span class='date'>{date.toString()}</span>
          <span class='time'>{time.toString()}</span>
        </div>
        {current && (
          <span class='quarter-week'>
            {termCode(year, season)} Week {week}{' '}
            {date.dayName('short', 'en-US')}
          </span>
        )}
      </p>
      <div class='icon-btn edit-icon'>Edit</div>
    </button>
  )
}
