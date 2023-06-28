/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { getTermDays } from '../../../terms/index.ts'
import { Day } from '../../../util/day.ts'
import { useRect } from '../../../util/useRect.ts'
import { CalendarHeaderRow, CalendarRow } from './CalendarRow.tsx'

/** Height of each calendar row. (px) */
const ROW_HEIGHT = 40

/** Returns a unique number for `date`'s week (starting on Monday). */
function weekId (date: Day) {
  return date.add(-1).sunday.id / 7
}

export type CalendarProps = {}
export function Calendar ({}: CalendarProps) {
  const t = getTermDays(2023, 'FA')

  const weeks: JSX.Element[] = []

  return (
    <div class='calendar'>
      <CalendarHeaderRow name='FA23' />
      <CalendarRow termDays={t} week={0} />
      <CalendarRow termDays={t} week={1} />
      <CalendarRow termDays={t} week={2} />
      <CalendarRow termDays={t} week={10} />
      <CalendarRow termDays={t} week={11} />
    </div>
  )
}
