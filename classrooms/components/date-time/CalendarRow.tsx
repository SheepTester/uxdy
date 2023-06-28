/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact/jsx-runtime'
import { Day } from '../../../util/day.ts'

const DAYS = [1, 2, 3, 4, 5, 6, 7]

export type CalendarRowProps = {
  weekId: number
  style?: JSX.CSSProperties
}
export function CalendarRow ({ weekId, style }: CalendarRowProps) {
  const sunday = Day.fromId(Math.round(weekId * 7))
  return (
    <div class='calendar-row' style={style}>
      <div class='calendar-week-num'>{sunday.add(1).month}</div>
      {DAYS.map(day => (
        <label class='calendar-day'>
          <input type='radio' class='visually-hidden' name='calendar-day' />
          {sunday.add(day).date}
        </label>
      ))}
    </div>
  )
}
