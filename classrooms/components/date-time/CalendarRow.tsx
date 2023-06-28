/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact/jsx-runtime'
import { TermDays } from '../../../terms/index.ts'
import { Day } from '../../../util/day.ts'
import { DAY_NAMES } from '../../day-names.ts'

const DAYS = DAY_NAMES.slice(1)

export type CalendarHeaderRowProps = {
  name?: string
}
export function CalendarHeaderRow ({ name }: CalendarHeaderRowProps) {
  return (
    <div class='calendar-row'>
      <div class='calendar-week-num'>{name}</div>
      {DAYS.map(day => (
        <div class='calendar-item calendar-week-day'>{day}</div>
      ))}
    </div>
  )
}

export type CalendarRowProps = {
  termDays: TermDays
  week: number
  style?: JSX.CSSProperties
}
export function CalendarRow ({ termDays, week, style }: CalendarRowProps) {
  // Shift all days so that Sunday becomes the next Saturday (+6), round down to
  // the last Sunday, then add 1 to get the first Monday of the quarter
  const firstMonday = termDays.start.add(6).sunday.add(1)
  return (
    <div class='calendar-row' style={style}>
      <div class='calendar-week-num'>{week === 11 ? 'Finals' : week}</div>
      {DAYS.map((_, i) => {
        const day = firstMonday.add((week - 1) * 7 + i)
        if (day < termDays.start || day > termDays.end) {
          return <div class='calendar-item' />
        }
        return (
          <label
            class={`calendar-item calendar-day ${
              day >= termDays.finals ? 'calendar-finals-day' : ''
            }`}
          >
            <input type='radio' class='visually-hidden' name='calendar-day' />
            {day.date}
          </label>
        )
      })}
    </div>
  )
}
