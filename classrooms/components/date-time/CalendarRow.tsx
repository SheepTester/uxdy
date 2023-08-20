/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { ComponentChildren } from 'preact'
import { getHolidays } from '../../../terms/holidays.ts'
import { Season, termCode, TermDays, termName } from '../../../terms/index.ts'
import { Day, DAY_NUMS } from '../../../util/Day.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'

export type CalendarRowProps = {
  children?: ComponentChildren
  week?: ComponentChildren
  class?: string
}
export function CalendarRow ({
  children,
  week,
  class: className = ''
}: CalendarRowProps) {
  return (
    <div class={`calendar-row ${className}`}>
      <div class='calendar-week-num'>{week}</div>
      {children}
    </div>
  )
}

export function CalendarHeaderRow () {
  return (
    <CalendarRow class='calendar-header-row' week={<span>Wk</span>}>
      {DAY_NUMS.map(day => (
        <div class={`calendar-item calendar-week-day`}>
          {Day.dayName(day + 1, 'short', 'en-US')}
        </div>
      ))}
    </CalendarRow>
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
    <CalendarRow class='calendar-heading-row calendar-quarter-heading-row'>
      <div class='gradient gradient-bg gradient-bottom' />
      <AbbrevHeading
        heading='h2'
        abbrev={termCode(year, season)}
        class='calendar-heading calendar-quarter-heading'
      >
        {termName(year, season)}
      </AbbrevHeading>
    </CalendarRow>
  )
}

export type CalendarMonthHeadingRowProps = {
  month: number
}
export function CalendarMonthHeadingRow ({
  month
}: CalendarMonthHeadingRowProps) {
  return (
    <CalendarRow class='calendar-heading-row calendar-month-heading-row'>
      <h3 class='calendar-heading calendar-month-heading'>
        {Day.monthName(month)}
      </h3>
    </CalendarRow>
  )
}

export type CalendarWeekRowProps = {
  termDays: TermDays
  start: Day
  end: Day
  monday: Day
  date: Day
  onDate: (date: Day) => void
}
export function CalendarWeekRow ({
  termDays,
  start,
  end,
  monday,
  date,
  onDate
}: CalendarWeekRowProps) {
  const endDay = monday.add(7)
  const week = Math.floor((monday.id - termDays.start.id) / 7) + 1
  const holidays = getHolidays(Math.max(monday.year, start.year))

  return (
    <div class='calendar-row calendar-date-row'>
      <div class='calendar-week-num'>
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
              day >= termDays.start && day <= termDays.end && !holidays[day.id]
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
