/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { Day } from '../../../util/day.ts'
import { useRect } from '../../../util/useRect.ts'
import { CalendarRow } from './CalendarRow.tsx'

/** Height of each calendar row. (px) */
const ROW_HEIGHT = 40
/**
 * Number of weeks before and after the current week to show by default in the
 * calendar.
 */
const INIT_WEEK_RANGE = 20

/** Returns a unique number for `date`'s week (starting on Monday). */
function weekId (date: Day) {
  return date.add(-1).sunday.id / 7
}

export type CalendarProps = {}
export function Calendar ({}: CalendarProps) {
  const [start, setStart] = useState(
    () => weekId(Day.today()) - INIT_WEEK_RANGE
  )
  // Exclusive
  const [end, setEnd] = useState(() => weekId(Day.today()) + INIT_WEEK_RANGE)

  const visibleRows: JSX.Element[] = []
  for (let week = start; week < end; week++) {
    // NOTE: Week IDs jump by 7 (because they're the IDs of their Sundays)
    if (week >= start && week < end) {
      visibleRows.push(<CalendarRow weekId={week} key={week} />)
    }
  }

  return <div class='calendar'>{visibleRows}</div>
}
