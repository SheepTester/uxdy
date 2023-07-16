/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'
import { inPT } from '../../lib/now.ts'
import { Calendar } from './Calendar.tsx'

export type DateTimePanelProps = {
  date: Day
  onDate: (date: Day, scrollToDate?: boolean) => void
  scrollToDate: number | null
  time: Time
  onTime: (customTime: Time | null) => void
  useNow: boolean
  onUseNow: (useNow: boolean) => void
  visible: boolean
  bottomPanelOpen: boolean
  onClose: () => void
}
export function DateTimePanel ({
  date,
  onDate,
  scrollToDate,
  time,
  onTime,
  useNow,
  onUseNow,
  visible,
  bottomPanelOpen,
  onClose
}: DateTimePanelProps) {
  return (
    <form
      class={`date-time-panel ${visible ? '' : 'date-time-panel-hidden'} ${
        bottomPanelOpen ? 'date-time-panel-bottom-panel' : ''
      } ${useNow ? '' : 'calendar-open'}`}
      onSubmit={e => {
        onClose()
        e.preventDefault()
      }}
    >
      <div class='date-time-flex'>
        <input
          type='date'
          name='date'
          value={date.toString()}
          onInput={e => {
            const date = Day.parse(e.currentTarget.value)
            if (date) {
              onDate(date, true)
            }
          }}
          disabled={useNow}
          class='date-input'
        />
        <button
          type='button'
          class='today-btn'
          onClick={() => onDate(Day.today(), true)}
          disabled={useNow}
        >
          Today
        </button>
        <button class='icon-btn close-date-btn'>Close</button>
      </div>
      <div class='date-time-flex'>
        <label class='checkbox-label'>
          <input
            type='checkbox'
            checked={useNow}
            onInput={e => onUseNow(e.currentTarget.checked)}
          />
          <span>
            Use current time
            {inPT() ? null : <span class='tz-note'>(in San Diego)</span>}
          </span>
        </label>
        <input
          type='time'
          value={time.toString(true)}
          onInput={e => {
            const time = Time.parse24(e.currentTarget.value)
            if (time) {
              onTime(time)
            }
          }}
          disabled={useNow}
          class='time-input'
        />
      </div>
      {!useNow && (
        <Calendar date={date} onDate={onDate} scrollToDate={scrollToDate} />
      )}
    </form>
  )
}
