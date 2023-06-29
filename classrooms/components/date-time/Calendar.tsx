/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import {
  getTermDays,
  Season,
  termCode,
  termName
} from '../../../terms/index.ts'
import { Day } from '../../../util/Day.ts'
import { useRect } from '../../../util/useRect.ts'
import {
  CalendarHeaderRow,
  CalendarMonthHeadingRow,
  CalendarQuarterHeadingRow,
  CalendarRow
} from './CalendarRow.tsx'

type TermCalendarProps = { year: number; season: Season }
function TermCalendar ({ year, season }: TermCalendarProps) {
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

export type CalendarProps = {}
export function Calendar ({}: CalendarProps) {
  return (
    <div class='calendar'>
      <div class='calendar-scroll-area'>
        <CalendarHeaderRow name='Week' />
        <TermCalendar year={2022} season='FA' />
        <TermCalendar year={2023} season='WI' />
        <TermCalendar year={2023} season='SP' />
        <TermCalendar year={2023} season='S1' />
        <TermCalendar year={2023} season='S2' />
      </div>
    </div>
  )
}
