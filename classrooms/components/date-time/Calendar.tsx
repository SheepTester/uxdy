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
  const { ref, height } = useRect<HTMLDivElement>()
  const [start, setStart] = useState(
    () => weekId(Day.today()) - INIT_WEEK_RANGE
  )
  // Exclusive
  const [end, setEnd] = useState(() => weekId(Day.today()) + INIT_WEEK_RANGE)
  const [scroll, setScroll] = useState(0)

  // Add an extra row at the top and bottom
  const scrollHeight = (end - start + 2) * ROW_HEIGHT

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }
    const scrollHandler = () => {
      setScroll(element.scrollTop)
    }
    element.addEventListener('scroll', scrollHandler)
    return () => {
      element.removeEventListener('scroll', scrollHandler)
    }
  }, [ref.current])

  const visibleRows: JSX.Element[] = []
  const endRow = Math.floor((scroll + height) / ROW_HEIGHT)
  for (let i = Math.floor(scroll / ROW_HEIGHT); i <= endRow; i++) {
    // NOTE: Week IDs jump by 7 (because they're the IDs of their Sundays)
    const week = start + i - 1
    if (week >= start && week < end) {
      visibleRows.push(
        <CalendarRow weekId={week} style={{ top: `${i * ROW_HEIGHT}px` }} />
      )
    }
  }

  return (
    <div class='calendar' ref={ref}>
      <div
        class='calendar-scroll-height'
        style={{ height: `${scrollHeight}px` }}
      />
      {visibleRows}
    </div>
  )
}
