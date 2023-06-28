/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { getTermDays, Season, termCode } from '../../../terms/index.ts'
import { Day } from '../../../util/day.ts'
import { useRect } from '../../../util/useRect.ts'
import { CalendarHeaderRow, CalendarRow } from './CalendarRow.tsx'

/** Height of each calendar row. (px) */
const ROW_HEIGHT = 40

type TermCalendarProps = { year: number; season: Season }
function TermCalendar ({ year, season }: TermCalendarProps) {
  const termDays = getTermDays(year, season)

  const weeks: JSX.Element[] = []
  for (
    let week = termDays.start.day === 1 ? 1 : 0;
    termDays.start.monday.add(week * 7) <= termDays.end;
    week++
  ) {
    weeks.push(<CalendarRow termDays={termDays} week={week} key={week} />)
  }

  return (
    <>
      <CalendarHeaderRow name={termCode(year, season)} />
      {weeks}
    </>
  )
}

export type CalendarProps = {}
export function Calendar ({}: CalendarProps) {
  return (
    <div class='calendar'>
      <TermCalendar year={2022} season='FA' />
      <TermCalendar year={2023} season='WI' />
      <TermCalendar year={2023} season='SP' />
      <TermCalendar year={2023} season='S1' />
      <TermCalendar year={2023} season='S2' />
    </div>
  )
}
