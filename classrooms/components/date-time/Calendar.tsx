/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact'
import { getTermDays, Season } from '../../../terms/index.ts'
import { Day } from '../../../util/Day.ts'
import {
  CalendarHeaderRow,
  CalendarMonthHeadingRow,
  CalendarQuarterHeadingRow,
  CalendarRow
} from './CalendarRow.tsx'

type TermCalendarProps = {
  year: number
  season: Season
  date: Day
  onDate: (date: Day) => void
  scrollToDate: number | null
}
function TermCalendar ({
  year,
  season,
  date,
  onDate,
  scrollToDate
}: TermCalendarProps) {
  const termDays = getTermDays(year, season)

  let month: number = termDays.start.monday.month
  const weeks: JSX.Element[] = [
    <CalendarMonthHeadingRow month={month} key='first month' />
  ]
  for (
    let monday = termDays.start.monday;
    monday <= termDays.end;
    monday = monday.add(7)
  ) {
    if (monday.month === month) {
      weeks.push(
        <CalendarRow
          termDays={termDays}
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

  return (
    <>
      <CalendarQuarterHeadingRow year={year} season={season} />
      {weeks}
    </>
  )
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
    for (const season of seasons) {
      calendars.push(
        <TermCalendar
          year={year}
          season={season}
          date={date}
          onDate={onDate}
          scrollToDate={scrollToDate}
          key={`${year} ${season}`}
        />
      )
    }
  }

  return (
    <div class='calendar'>
      <div class='date-time-flex'>
        <input
          type='date'
          name='date'
          value={date.toString()}
          onInput={e => {
            const date = Day.parse(e.currentTarget.value)
            if (date) {
              onDate(date, true)
            }
          }}
          class='date-input'
        />
        <button class='today-btn' onClick={() => onDate(Day.today(), true)}>
          Today
        </button>
      </div>
      <div class='calendar-scroll-area'>
        <CalendarHeaderRow />
        {calendars}
      </div>
    </div>
  )
}
