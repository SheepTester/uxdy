/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { ComponentChildren } from 'preact'
import { Season, termCode, TermDays, termName } from '../../../terms/index.ts'
import { Day, DAY_NUMS } from '../../../util/Day.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'

export type CalendarHeaderRowProps = {
  date: Day
}
export function CalendarHeaderRow ({ date }: CalendarHeaderRowProps) {
  return (
    <>
      <div class='calendar-row calendar-header-row'>
        <div class='calendar-week-num'>
          <span>Wk</span>
        </div>
        {DAY_NUMS.map(day => (
          <div
            class={`calendar-item calendar-week-day ${
              (day + 1) % 7 === date.day ? 'calendar-selected' : ''
            }`}
          >
            {Day.dayName(day + 1, 'short', 'en-US')}
          </div>
        ))}
      </div>
    </>
  )
}

type CalendarHeadingRowProps = {
  children?: ComponentChildren
  class?: string
}
function CalendarHeadingRow ({
  children,
  class: className = ''
}: CalendarHeadingRowProps) {
  return (
    <div class={`calendar-row calendar-heading-row ${className}`}>
      <div class='calendar-week-num'></div>
      {children}
    </div>
  )
}

export type CalendarQuarterHeadingRowProps = {
  year: number
  season: Season
}
export function CalendarQuarterHeadingRow ({
  year,
  season
}: CalendarQuarterHeadingRowProps) {
  return (
    <CalendarHeadingRow class='calendar-quarter-heading-row'>
      <div class='gradient gradient-bg gradient-bottom' />
      <AbbrevHeading
        heading='h2'
        abbrev={termCode(year, season)}
        class='calendar-heading calendar-quarter-heading'
      >
        {termName(year, season)}
      </AbbrevHeading>
    </CalendarHeadingRow>
  )
}

export type CalendarMonthHeadingRowProps = {
  month: number
}
export function CalendarMonthHeadingRow ({
  month
}: CalendarMonthHeadingRowProps) {
  return (
    <CalendarHeadingRow class='calendar-month-heading-row'>
      <h3 class='calendar-heading calendar-month-heading'>
        {Day.monthName(month)}
      </h3>
    </CalendarHeadingRow>
  )
}

/** Height of the calendar header. */
const HEADER_HEIGHT = 120

export type CalendarRowProps = {
  termDays: TermDays
  start: Day
  end: Day
  monday: Day
  date: Day
  onDate: (date: Day) => void
}
export function CalendarRow ({
  termDays,
  start,
  end,
  monday,
  date,
  onDate
}: CalendarRowProps) {
  const endDay = monday.add(7)

  const week = Math.floor((monday.id - termDays.start.id) / 7) + 1
  const hasSelected = monday <= date && date < endDay

  return (
    <div class='calendar-row calendar-date-row'>
      <div
        class={`calendar-week-num ${hasSelected ? 'calendar-selected' : ''}`}
      >
        {week === 11
          ? 'FI'
          : termDays.start < endDay && monday <= termDays.end
          ? week
          : ''}
      </div>
      {DAY_NUMS.map(i => {
        const day = monday.add(i)
        if (day < start || day > end) {
          return <div class='calendar-item' />
        }
        return (
          <label
            class={`calendar-item calendar-day ${
              day >= termDays.finals && day <= termDays.end
                ? 'calendar-finals-day'
                : ''
            } ${day.id === date.id ? 'calendar-selected' : ''} ${
              day >= termDays.start && day <= termDays.end
                ? ''
                : 'calendar-break-day'
            }`}
          >
            <input
              type='radio'
              class='visually-hidden'
              name='calendar-day'
              onKeyDown={e => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  // TODO: This is very finicky
                  const up = e.key === 'ArrowUp'
                  onDate(date.add(up ? -7 : 7))
                  e.preventDefault()
                }
              }}
              onInput={() => onDate(day)}
              checked={day.id === date.id}
            />
            {day.date}
          </label>
        )
      })}
    </div>
  )
}
