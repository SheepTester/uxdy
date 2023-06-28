/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact/jsx-runtime'
import { Day } from '../../../util/day.ts'

export type CalendarRowProps = {
  weekId: number
  style?: JSX.CSSProperties
}
export function CalendarRow ({ weekId, style }: CalendarRowProps) {
  const monday = Day.fromId(Math.round(weekId * 7)).add(1)
  return (
    <div class='calendar-row' style={style}>
      {monday.toString()}
    </div>
  )
}
