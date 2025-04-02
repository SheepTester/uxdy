/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { getTerm, termCode } from '../../../terms/index.ts'
import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'
import { useMoment } from '../../moment-context.ts'

const dateFormat = new Intl.DateTimeFormat([], {
  dateStyle: 'short',
  timeStyle: 'short'
})

export type DateTimeButtonProps = {
  onClick: () => void
  bottomPanelOpen: boolean
  disabled: boolean
}
export function DateTimeButton ({
  onClick,
  bottomPanelOpen,
  disabled
}: DateTimeButtonProps) {
  const {
    date,
    time,
    currentTerm: { year, season, current, week }
  } = useMoment()
  return (
    <button
      class={`date-time-button ${bottomPanelOpen ? 'bottom-panel-open' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <p class='showing-schedule-wrapper'>
        <span class='showing-schedule-text'>Showing schedule for</span>
        <div class='date-time'>
          {dateFormat.format(date.toLocal(time.hour, time.minute))}
        </div>
        {current && (
          <span class='quarter-week'>
            {termCode(year, season)} {week < 10 ? `Week ${week}` : 'Finals'}{' '}
            {date.dayName('short')}
          </span>
        )}
      </p>
      <div class='filled-icon-btn edit-icon'>Edit</div>
    </button>
  )
}
