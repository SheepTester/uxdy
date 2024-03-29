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
  CalendarRow,
  CalendarWeekRow
} from './CalendarRow.tsx'

/**
 * - `none` means not to scroll to the date. This is if you're selecting the
 *   date by clicking on the calendar, so that it doesn't force you to the date
 *   while you're trying to scroll.
 * - `init` means to instantly scroll to the date. This is only used when the
 *   app starts, so the calendar opens with the current day in view.
 * - `date-edited` means to smooth scroll to the date. When entering in the date
 *   through the date input or today button, it will scroll to the date.
 */
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
      <CalendarWeekRow
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

const seasons: Season[] = ['WI', 'SP', 'S1', 'S2', 'FA']

export type CalendarProps = {
  date: Day
  onDate: (date: Day, scrollToDate?: boolean) => void
  scrollMode: ScrollMode
  freeScroll: () => void
}
export function Calendar ({ freeScroll, ...props }: CalendarProps) {
  const { date, scrollMode } = props
  const selectedStart = date.month <= 6 ? date.year - 1 : date.year
  const selectedEnd = date.month >= 9 ? date.year + 1 : date.year
  const [start, setStart] = useState(selectedStart)
  const [end, setEnd] = useState(selectedEnd)
  // This implementation sucks, but useEffect isn't ideal because I also want to
  // render the new start/end immediately so the month can be scrolled to in the
  // correct position.
  if (scrollMode === 'date-edited') {
    if (start !== selectedStart) {
      setStart(selectedStart)
    }
    if (end !== selectedEnd) {
      setEnd(selectedEnd)
    }
  }

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
      <CalendarHeaderRow />
      <CalendarRow class='show-year-btn-top'>
        <button
          type='button'
          class='show-year-btn'
          onClick={e => {
            setStart(start - 1)
            freeScroll()

            // Scroll down so it looks like the scroll area was extended upwards
            const target = e.currentTarget
              .closest('.calendar-scroll-area')
              ?.querySelector('.calendar-month')
            if (target instanceof HTMLElement) {
              const oldX = target.offsetTop
              window.requestAnimationFrame(() => {
                target.parentElement?.scrollTo({
                  top: target.offsetTop - oldX
                })
              })
            }
          }}
        >
          Show {start - 1}
        </button>
      </CalendarRow>
      {calendars}
      <CalendarRow>
        <button
          type='button'
          class='show-year-btn'
          onClick={() => {
            setEnd(end + 1)
            freeScroll()
          }}
        >
          Show {end + 1}
        </button>
      </CalendarRow>
      <div class='gradient gradient-sticky gradient-bottom' />
    </div>
  )
}
