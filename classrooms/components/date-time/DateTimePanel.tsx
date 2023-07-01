/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'
import { Calendar } from './Calendar.tsx'

export type DateTimePanelProps = {
  date: Day
  onDate: (date: Day, scrollToDate?: boolean) => void
  scrollToDate: number | null
  realTime: Time
  customTime: Time | null
  onCustomTime: (customTime: Time | null) => void
  visible: boolean
  bottomPanelOpen: boolean
  onClose: () => void
}
export function DateTimePanel ({
  date,
  onDate,
  scrollToDate,
  realTime,
  customTime,
  onCustomTime,
  visible,
  bottomPanelOpen,
  onClose
}: DateTimePanelProps) {
  return (
    <form
      class={`date-time-panel ${visible ? '' : 'date-time-panel-hidden'} ${
        bottomPanelOpen ? 'date-time-panel-bottom-panel' : ''
      }`}
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
          class='date-input'
        />
        <button
          type='button'
          class='today-btn'
          onClick={() => onDate(Day.today(), true)}
        >
          Today
        </button>
        <button class='icon-btn close-date-btn'>Close</button>
      </div>
      <Calendar date={date} onDate={onDate} scrollToDate={scrollToDate} />
      <div class='date-time-flex'>
        <label class='checkbox-label'>
          <input
            type='checkbox'
            checked={!customTime}
            onInput={e => {
              if (e.currentTarget.checked) {
                onCustomTime(null)
              } else {
                onCustomTime(realTime)
              }
            }}
          />
          Use current time
        </label>
        <input
          type='time'
          value={(customTime ?? realTime).toString(true)}
          onInput={e => {
            const time = Time.parse24(e.currentTarget.value)
            if (time) {
              onCustomTime(time)
            }
          }}
          disabled={!customTime}
          class='time-input'
        />
      </div>
    </form>
  )
}
