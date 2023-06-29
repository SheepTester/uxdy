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

export type CalendarProps = {
  date: Day
  onDate: (date: Day, scrollToDate?: boolean) => void
  scrollToDate: number | null
}
export function Calendar ({ date, onDate, scrollToDate }: CalendarProps) {
  return (
    <div class='calendar'>
      <div>
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
        />
        <button onClick={() => onDate(Day.today(), true)}>Today</button>
      </div>
      <div class='calendar-scroll-area'>
        <CalendarHeaderRow name='Wk' />
        <TermCalendar
          year={2022}
          season='FA'
          date={date}
          onDate={onDate}
          scrollToDate={scrollToDate}
        />
        <TermCalendar
          year={2023}
          season='WI'
          date={date}
          onDate={onDate}
          scrollToDate={scrollToDate}
        />
        <TermCalendar
          year={2023}
          season='SP'
          date={date}
          onDate={onDate}
          scrollToDate={scrollToDate}
        />
        <TermCalendar
          year={2023}
          season='S1'
          date={date}
          onDate={onDate}
          scrollToDate={scrollToDate}
        />
        <TermCalendar
          year={2023}
          season='S2'
          date={date}
          onDate={onDate}
          scrollToDate={scrollToDate}
        />
      </div>
    </div>
  )
}
