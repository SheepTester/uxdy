/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { getTerm, getTermDays, Season, TermDays } from '../../../terms/index.ts'
import { Day } from '../../../util/Day.ts'
import {
  CalendarHeaderRow,
  CalendarMonthHeadingRow,
  CalendarQuarterHeadingRow,
  CalendarRow
} from './CalendarRow.tsx'

export type ScrollMode = 'none' | 'init' | 'date-edited'

/** Height of the calendar header. */
const HEADER_HEIGHT = 90

type MonthCalendarProps = TermCalendarProps & {
  month: number
}
function MonthCalendar ({
  start,
  end,
  scrollMode,
  month,
  ...props
}: MonthCalendarProps) {
  const { date } = props

  const monthStart = Day.max(start, Day.from(start.year, month, 1))
  const monthEnd = Day.min(end, Day.from(start.year, month + 1, 0))
  const weeks: JSX.Element[] = []
  for (
    let monday = monthStart.monday;
    monday <= monthEnd;
    monday = monday.add(7)
  ) {
    weeks.push(
      <CalendarRow
        monday={monday}
        start={monthStart}
        end={monthEnd}
        key={monday.id}
        {...props}
      />
    )
  }

  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const div = ref.current
    if (
      div?.parentElement &&
      scrollMode !== 'none' &&
      date >= monthStart &&
      date <= monthEnd
    ) {
      div.parentElement.scrollTo({
        top: div.offsetTop - HEADER_HEIGHT,
        // `scrollToDate` is only 1 when the web page first loads
        behavior: scrollMode === 'init' ? 'auto' : 'smooth'
      })
    }
  }, [scrollMode, date.id, monthStart.id, monthEnd.id])

  return (
    <div class='calendar-month' ref={ref}>
      <CalendarMonthHeadingRow month={month} />
      {weeks}
    </div>
  )
}

type TermCalendarProps = {
  termDays: TermDays
  start: Day
  end: Day
  date: Day
  onDate: (date: Day) => void
  scrollMode: ScrollMode
}
function TermCalendar (props: TermCalendarProps) {
  const { start, end } = props
  const months: JSX.Element[] = []
  for (let month = start.month; month <= end.month; month++) {
    months.push(<MonthCalendar month={month} key={month} {...props} />)
  }
  return <>{months}</>
}

type YearRange = {
  start: number
  end: number
}
function useYearRange (date: Day, inputtingDate: boolean): YearRange {
  const { season } = getTerm(date)
  const selectedRange = {
    start: season === 'WI' || season === 'SP' ? date.year - 1 : date.year,
    end: season === 'FA' ? date.year + 1 : date.year
  }
  const [start, setStart] = useState(selectedRange.start)
  const [end, setEnd] = useState(selectedRange.end)
  useEffect(() => {
    if (inputtingDate) {
      setStart(selectedRange.start)
      setEnd(selectedRange.end)
    }
  }, [inputtingDate, date.id])
  // Return `selectedRange` early so it doesn't scroll to the month's old
  // position
  return inputtingDate ? selectedRange : { start, end }
}

const seasons: Season[] = ['WI', 'SP', 'S1', 'S2', 'FA']

export type CalendarProps = {
  date: Day
  onDate: (date: Day, scrollToDate?: boolean) => void
  scrollMode: ScrollMode
}
export function Calendar (props: CalendarProps) {
  const { date, scrollMode } = props
  const { start, end } = useYearRange(date, scrollMode === 'date-edited')

  // Move focus to currently selected calendar day (this is still finicky)
  useEffect(() => {
    if (
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.name === 'calendar-day' &&
      !document.activeElement.checked
    ) {
      const checked = document.querySelector('[name="calendar-day"]:checked')
      if (checked instanceof HTMLInputElement) {
        checked.focus()
      }
    }
  }, [date.id])

  const calendars: JSX.Element[] = []
  for (let year = start; year <= end; year++) {
    const yearTermDays = seasons.map(season => getTermDays(year, season))
    for (const [i, season] of seasons.entries()) {
      calendars.push(
        <CalendarQuarterHeadingRow
          year={year}
          season={season}
          key={`${year} ${season} heading`}
        />,
        <TermCalendar
          termDays={yearTermDays[i]}
          start={i === 0 ? Day.from(year, 1, 1) : yearTermDays[i].start.monday}
          end={
            yearTermDays[i + 1]?.start.monday.add(-1) ??
            Day.from(year + 1, 1, 0)
          }
          key={`${year} ${season}`}
          {...props}
        />
      )
    }
  }

  return (
    <div class='calendar-scroll-area'>
      <div class='gradient gradient-sticky gradient-top' />
      <CalendarHeaderRow date={date} />
      {calendars}
      <div class='gradient gradient-sticky gradient-bottom' />
    </div>
  )
}
