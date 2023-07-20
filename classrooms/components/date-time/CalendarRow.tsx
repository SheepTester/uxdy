/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { ComponentChildren } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
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
      <div class='calendar-row calendar-deco-row'>
        <div class='calendar-deco'>
          {/* <div class='calendar-header-line' /> */}
          {/* <div class='gradient gradient-top' /> */}
        </div>
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
  month?: number
  date: Day
  onDate: (date: Day) => void
  scrollToDate: number | null
}
export function CalendarRow ({
  termDays,
  start,
  end,
  monday,
  month,
  date,
  onDate,
  scrollToDate
}: CalendarRowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const div = ref.current

  const endDay = monday.add(7)

  useEffect(() => {
    // Shouldn't need to adjust scroll on resize since there's no text wrapping
    // in the calendar
    if (div?.parentElement && scrollToDate && date >= monday && date < endDay) {
      const scrollRect = div.parentElement.getBoundingClientRect()
      const rowRect = div.getBoundingClientRect()
      // offsetTop is the y-position of the div relative to the top of the
      // scroll contents
      div.parentElement.scrollTo({
        top:
          div.offsetTop -
          HEADER_HEIGHT -
          (scrollRect.height - HEADER_HEIGHT - rowRect.height) / 2,
        // `scrollToDate` is only 1 when the web page first loads
        behavior: scrollToDate === 1 ? 'auto' : 'smooth'
      })
    }
  }, [div, scrollToDate])

  const week = Math.floor((monday.id - termDays.start.id) / 7) + 1
  const hasSelected = monday <= date && date < endDay

  return (
    <div class='calendar-row calendar-date-row' ref={ref}>
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
        if ((month && day.month !== month) || day < start || day > end) {
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

                  const element = e.currentTarget
                  window.requestAnimationFrame(() => {
                    const input =
                      element.parentElement?.parentElement?.parentElement?.querySelector(
                        ':checked'
                      )
                    if (input instanceof HTMLInputElement) {
                      input.focus()
                    }
                  })
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
