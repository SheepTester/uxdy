/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'
import { Calendar } from './Calendar.tsx'

export type DateTimePickerProps = {
  date: Day
  onDate: (date: Day, scrollToDate?: boolean) => void
  scrollToDate: number | null
  realTime: Time
  customTime: Time | null
  onCustomTime: (customTime: Time | null) => void
}
export function DateTimePicker ({
  date,
  onDate,
  scrollToDate,
  realTime,
  customTime,
  onCustomTime
}: DateTimePickerProps) {
  return (
    <div class='date-time-picker'>
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
    </div>
  )
}
