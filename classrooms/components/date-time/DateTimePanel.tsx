/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'
import { inPT } from '../../lib/now.ts'
import { Calendar, ScrollMode } from './Calendar.tsx'

export type DateTimePanelProps = {
  date: Day
  onDate: (date: Day, source: 'calendar' | 'input') => void
  scrollMode: ScrollMode
  time: Time
  onTime: (customTime: Time | null) => void
  useNow: boolean
  onUseNow: (useNow: boolean) => void
  visible: boolean
  class: string
  onClose: () => void
}
export function DateTimePanel ({
  date,
  onDate,
  scrollMode,
  time,
  onTime,
  useNow,
  onUseNow,
  visible,
  class: className,
  onClose
}: DateTimePanelProps) {
  return (
    <form
      class={`date-time-panel ${
        visible ? '' : 'date-time-panel-hidden'
      } ${className} calendar-open`}
      onSubmit={e => {
        onClose()
        e.preventDefault()
      }}
    >
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
        {date.id !== Day.today().id && (
          <button
            type='button'
            class='today-btn'
            onClick={() => onDate(Day.today(), 'input')}
          >
            Today
          </button>
        )}
        <button class='icon-btn close-date-btn'>Close</button>
      </div>
      <div class='date-time-flex'>
        <input
          type='date'
          name='date'
          value={date.toString()}
          onInput={e => {
            const date = Day.parse(e.currentTarget.value)
            if (date) {
              if (useNow) {
                onUseNow(false)
              }
              onDate(date, 'input')
            }
          }}
          class='date-input'
        />
        <input
          type='time'
          value={time.toString(true)}
          onInput={e => {
            const time = Time.parse24(e.currentTarget.value)
            if (time) {
              if (useNow) {
                onUseNow(false)
              }
              onTime(time)
            }
          }}
          class='time-input'
        />
      </div>
      <Calendar
        date={date}
        onDate={date => {
          if (useNow) {
            onUseNow(false)
          }
          onDate(date, 'calendar')
        }}
        scrollMode={scrollMode}
      />
    </form>
  )
}
