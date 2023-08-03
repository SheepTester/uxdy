/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact'
import { useEffect } from 'preact/hooks'
import { getTermDays, Season, TermDays } from '../../../terms/index.ts'
import { Day } from '../../../util/Day.ts'
import {
  CalendarHeaderRow,
  CalendarMonthHeadingRow,
  CalendarQuarterHeadingRow,
  CalendarRow
} from './CalendarRow.tsx'

type MonthCalendarProps = TermCalendarProps & {
  month: number
}
function MonthCalendar ({
  start,
  end,
  scrollToDate,
  month,
  ...props
}: MonthCalendarProps) {
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
  return (
    <div class='calendar-month'>
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
  scrollToDate: number | null
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
  scrollToDate: number | null
}
export function Calendar ({ date, onDate, scrollToDate }: CalendarProps) {
  // const [start, setStart] = useState(() => {
  //   const { season } = getTerm(date)
  //   return season === 'WI' || season === 'SP' ? date.year - 1 : date.year
  // })
  // const [end, setEnd] = useState(() => {
  //   const { season } = getTerm(date)
  //   return season === 'FA' ? date.year + 1 : date.year
  // })
  const start = 2023
  const end = 2023

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
          date={date}
          onDate={onDate}
          scrollToDate={scrollToDate}
          key={`${year} ${season}`}
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
