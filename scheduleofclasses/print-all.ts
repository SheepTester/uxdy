// deno run --allow-net scheduleofclasses/print-all.ts

import {
  blue,
  bold,
  cyan,
  gray,
  green,
  magenta,
  red,
  yellow
} from 'https://deno.land/std@0.177.0/fmt/colors.ts'
import { DAYS, getCourseIterator } from './index.ts'

const TERM = 'SP23'

/**
 * Displays a time in minutes since midnight for the console. I use 24-hour so
 * this function does too.
 */
function displayTime (minutes: number): string {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
}

console.log(bold(TERM))
for await (const item of getCourseIterator(TERM)) {
  if ('subject' in item) {
    const units =
      item.units.from === item.units.to
        ? item.units.from
        : item.units.inc !== 1
        ? `${item.units.from}-${item.units.to} by ${item.units.inc}`
        : `${item.units.from}-${item.units.to}`
    console.log()
    console.log(
      `${item.subject} ${item.number}: ${gray(`${item.title} (${units})`)}`
    )
  } else {
    const time = item.time
      ? `${item.time.days.map(day => DAYS[day]).join('')} ${displayTime(
          item.time.start
        )}–${displayTime(item.time.end)}`
      : item.location
      ? '[Time TBA]'
      : '[Room/Time TBA]'
    const location = item.location
      ? ` at ${green(`${item.location.building} ${item.location.room}`)}`
      : item.time
      ? green(' [Room TBA]')
      : ''
    const info = item.selectable
      ? item.selectable.capacity === Infinity
        ? yellow(' no limit')
        : ` ${red(
            `${item.selectable.available}/${item.selectable.capacity}`
          )} available`
      : item.section instanceof Date
      ? ` on ${item.section.toISOString().slice(0, 10)}`
      : ''
    const instructor =
      item.instructors.length > 0
        ? item.instructors
            .map(([first, last]) => blue(`${first} ${bold(last)}`))
            .join(', ')
        : red('staff')
    console.log(
      `${gray('|')} ${magenta(item.type)} ${
        item.section instanceof Date ? red('exm') : yellow(item.section)
      } ${cyan(time)}${location}${info} by ${instructor}`
    )
  }
}
