/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact'
import {
  getTermDays,
  Season,
  termCode,
  TermDays
} from '../../../terms/index.ts'
import { Day } from '../../../util/Day.ts'
import {
  CalendarHeaderRow,
  CalendarMonthHeadingRow,
  CalendarQuarterHeadingRow,
  CalendarRow
} from './CalendarRow.tsx'

type TermCalendarProps = {
  termDays: TermDays
  start: Day
  end: Day
  date: Day
  onDate: (date: Day) => void
  scrollToDate: number | null
}
function TermCalendar ({
  termDays,
  start,
  end,
  date,
  onDate,
  scrollToDate
}: TermCalendarProps) {
  let month: number = start.monday.month
  const weeks: JSX.Element[] = []
  if (start.monday.month === start.month) {
    weeks.push(<CalendarMonthHeadingRow month={month} key='first month' />)
  }
  for (
    let monday = start.monday;
    monday <= end.monday;
    monday = monday.add(7)
  ) {
    if (monday.month === month && monday >= start) {
      weeks.push(
        <CalendarRow
          termDays={termDays}
          start={start}
          end={end}
          monday={monday}
          month={month}
          date={date}
          onDate={onDate}
          scrollToDate={scrollToDate}
          key={monday.id}
        />
      )
    }

    const sunday = monday.add(6)
    if (sunday.month !== month) {
      month = sunday.month
      weeks.push(
        <CalendarMonthHeadingRow month={month} key={`month ${month}`} />,
        <CalendarRow
          termDays={termDays}
          start={start}
          end={end}
          monday={monday}
          month={month}
          date={date}
          onDate={onDate}
          scrollToDate={scrollToDate}
          key={`new month ${monday.id}`}
        />
      )
    }
  }

  return <>{weeks}</>
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
  let start = 2023
  let end = 2023

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
      <CalendarHeaderRow date={date} />
      {calendars}
      <div class='gradient gradient-sticky gradient-bottom' />
    </div>
  )
}
