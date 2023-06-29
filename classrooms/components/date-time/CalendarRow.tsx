/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { ComponentChildren, JSX } from 'preact'
import { Season, termCode, TermDays, termName } from '../../../terms/index.ts'
import { Day, DAY_NUMS } from '../../../util/Day.ts'

export type CalendarHeaderRowProps = {
  name?: string
}
export function CalendarHeaderRow ({ name }: CalendarHeaderRowProps) {
  return (
    <div class='calendar-row calendar-header-row'>
      <div class='calendar-week-num'>{name}</div>
      {DAY_NUMS.map(day => (
        <div class='calendar-item calendar-week-day'>
          {Day.dayName(day + 1, 'short', 'en-US')}
        </div>
      ))}
    </div>
  )
}

type CalendarHeadingRowProps = {
  children?: ComponentChildren
}
function CalendarHeadingRow ({ children }: CalendarHeadingRowProps) {
  return (
    <div class='calendar-heading-row'>
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
    <CalendarHeadingRow>
      <h2 class='calendar-heading calendar-quarter-heading'>
        {termCode(year, season)}: {termName(year, season)}
      </h2>
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
    <CalendarHeadingRow>
      <h3 class='calendar-heading calendar-month-heading'>
        {Day.monthName(month)}
      </h3>
    </CalendarHeadingRow>
  )
}

export type CalendarRowProps = {
  termDays: TermDays
  monday: Day
  month?: number
  style?: JSX.CSSProperties
}
export function CalendarRow ({
  termDays,
  monday,
  month,
  style
}: CalendarRowProps) {
  const week = Math.floor((monday.id - termDays.start.id) / 7) + 1
  return (
    <div class='calendar-row' style={style}>
      <div class='calendar-week-num'>{week === 11 ? 'Final' : week}</div>
      {DAY_NUMS.map(i => {
        const day = monday.add(i)
        if (
          (month && day.month !== month) ||
          day < termDays.start ||
          day > termDays.end
        ) {
          return <div class='calendar-item' />
        }
        return (
          <label
            class={`calendar-item calendar-day ${
              day >= termDays.finals ? 'calendar-finals-day' : ''
            }`}
          >
            <input type='radio' class='visually-hidden' name='calendar-day' />
            {day.date}
          </label>
        )
      })}
    </div>
  )
}
