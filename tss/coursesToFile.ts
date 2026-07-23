/**
 * @file
 * Same format as classrooms/scripts/coursesToFile.ts
 *
 * usage: node tss/coursesToFile.ts <term>
 */

import { open, readFile } from 'node:fs/promises'
import type {
  AllCourses,
  NormalMeetingType,
  ResolvedDay,
  Section
} from './index.ts'

function isInPerson ({
  time,
  location
}: Section['location_details' | 'meetings'][number]): boolean {
  if (time === '' || time === 'TBA') {
    return false
  }
  if (
    location === '' ||
    location === 'Remote' ||
    location === 'TBA' ||
    location === 'tba'
  ) {
    return false
  }
  return true
}

function * printTime (
  hour: string,
  minute: string,
  amPm: string
): Generator<string> {
  const isAm = amPm === 'a' || amPm === 'A'
  const parsedHour = hour === '12' ? (isAm ? 0 : 12) : isAm ? +hour : +hour + 12
  yield parsedHour.toString().padStart(2, '0')
  yield minute
}

const types: Record<Section['location_details'][number]['type'], string> = {
  Seminar: 'SE',
  Lecture: 'LE',
  Lab: 'LA',
  Discussion: 'DI',
  Pr: 'PR',
  Studio: 'ST',
  Tutorial: 'TU',
  Fw: 'FW',
  'Independent Study': 'IN',
  It: 'IT',
  Cl: 'CL',
  Co: 'CO',
  Ot: 'OT',
  Final: 'FI',
  Midterm: 'MI',
  Other: 'OT'
}
const DAYS = 'UMTWRFS'
function * printMeeting (
  type: Section['location_details'][number]['type'] | 'Class',
  { time, location }: Section['location_details' | 'meetings'][number],
  days?: string[]
): Generator<string> {
  const maybeLocation =
    location === '' ||
    location === 'Remote' ||
    location === 'TBA' ||
    location === 'tba'
      ? null
      : location.split(' ')
  yield (maybeLocation?.[0] ?? 'TBA').padEnd(5)
  const isTimeTba = time === '' || time === 'TBA'
  if (days) {
    if (isTimeTba) {
      yield 'TBA  '
    } else {
      if (days.length === 0) {
        throw new Error('Missing days')
      }

      yield days
        .map(day => DAYS.indexOf(day))
        .sort()
        .join('')
        // This is probably technically incorrect, ISIS supports up to all 7 days,
        // but whatever
        .padEnd(5)
    }
  }
  if (type === 'Class') {
    // idk
    yield 'OT'
  } else {
    yield types[type]
  }
  yield (maybeLocation?.[1].replace(/^B-/, 'B') ?? 'TBA').padEnd(5)
  if (isTimeTba) {
    yield 'TBA '
    yield 'TBA '
  } else {
    // '6:30 PM\u20137:50 PM'
    // '7:00pm-9:59pm'
    const match = time.match(
      /^(1?\d):([0-5]\d) ?([aApP])[mM][\u2013-](1?\d):([0-5]\d) ?([aApP])[mM]$/
    )
    if (!match) {
      throw new Error(`Time does not pass regex: '${time}'`)
    }
    const [, startHour, startMin, startAmPm, endHour, endMin, endAmPm] = match
    yield * printTime(startHour, startMin, startAmPm)
    yield * printTime(endHour, endMin, endAmPm)
  }
}

export type CourseToFileOptions = {
  scrapeTime: number
  buildingsOnly: boolean
}
export function * coursesToFile (
  courses: AllCourses,
  resolvedDays: ResolvedDay[],
  { scrapeTime, buildingsOnly }: CourseToFileOptions
): Generator<string> {
  const resolvedDayMap = new Map(
    Map.groupBy(resolvedDays, day => day.sectionId)
      .entries()
      .map(([sectionId, days]) => [
        sectionId,
        new Map(days.values().map(({ index, days }) => [index, days]))
      ])
  )
  yield `V4${scrapeTime}\n`
  for (const { class_name, course_title, sections } of courses.values()) {
    const groups = Map.groupBy(
      sections,
      // Pretty sure this is 1-indexed
      section => +section.section_code.split('-')[0]
    )
      .entries()
      .map(([groupCode, group]) => ({
        groupCode,
        meetings: group
          .values()
          .flatMap(section =>
            section.location_details.values().map((meeting, index) => ({
              sectionId: section.section_id,
              index,
              seats: section.seats,
              meetingCode: +section.section_code.split('-')[1],
              ...meeting
            }))
          )
          .filter(meeting => !buildingsOnly || isInPerson(meeting))
          .filter(meeting => {
            if (
              meeting.type !== 'Final' &&
              meeting.type !== 'Midterm' &&
              meeting.type !== 'Other'
            ) {
              const _type: NormalMeetingType = meeting.type
              return true
            } else {
              return false
            }
          })
          .toArray(),
        exams: group
          .values()
          .flatMap(section => section.meetings)
          .filter(exam => !buildingsOnly || isInPerson(exam))
          // Classrooms website assumes exam day is always available
          .filter(exam => exam.day !== 'TBA')
          .toArray(),
        instructors: new Set(
          group
            .values()
            .flatMap(section =>
              section.instructors === 'TBA'
                ? []
                : section.instructors.split(', ')
            )
            .map(name => {
              // Best effort splitting of first and last name. Unfortunately
              // cannot handle both "Betancur Rodriguez, Ricard" and "Maltez,
              // Vivien Ileana"
              const parts = name.split(' ')
              return `${parts.slice(0, -1).join(' ')},${parts.at(-1)}`
            })
        )
      }))
      .filter(group => group.meetings.length > 0 || group.exams.length > 0)
      .toArray()
      .sort((a, b) => a.groupCode - b.groupCode)

    if (groups.length === 0) {
      continue
    }

    const [subject, number] = class_name.split('-')
    yield subject.padEnd(4)
    // Remove leading zeroes because UI search isn't designed for them
    yield number.replace(/^0+/, '').padEnd(5)
    if (!buildingsOnly) {
      yield course_title
    }
    yield '\n'

    const cantUseLetterCode =
      groups.reduce((cum, curr) => Math.max(cum, curr.groupCode), 0) > 26
    const cantUseNumberCode = groups
      .values()
      .some(group => group.meetings.length > 1)
    if (cantUseLetterCode && cantUseNumberCode) {
      console.error(groups)
      throw new Error(`Can't use letter nor number code for ${class_name}`)
    }
    // Prefer letter code
    const useLetterCode = !cantUseLetterCode

    for (const { groupCode, meetings, exams, instructors } of groups) {
      // We don't have access to the distinction between enrollable/unenrollable
      // meetings
      yield exams.length > 0 ? "'" : ' '

      const prefix = useLetterCode
        ? String.fromCharCode(65 + groupCode - 1)
        : groupCode.toString().padStart(3, '0')
      yield prefix
      if (useLetterCode) {
        yield '00'
      }

      if (!buildingsOnly) {
        yield '\t'
        yield Array.from(instructors).sort().join('\t')
      }
      yield '\n'

      for (const meeting of meetings) {
        const [, capacity] = meeting.seats.split('/')
        yield capacity.padStart(4, '0')

        yield * printMeeting(
          meeting.type,
          meeting,
          resolvedDayMap.get(meeting.sectionId)?.get(meeting.index) ?? []
        )

        yield prefix
        if (useLetterCode) {
          yield meeting.meetingCode.toString().padStart(2, '0')
        }
      }
      yield '\n'

      if (exams.length > 0) {
        for (const exam of exams) {
          const [month, date, year] = exam.day.split('/')
          yield `${year.padStart(4, '0')}${month.padStart(2, '0')}${date.padStart(2, '0')}`

          yield * printMeeting(exam.label, exam)
        }
        yield '\n'
      }
    }
  }
}

if (import.meta.main) {
  if (process.argv.length !== 3) {
    console.error('usage: node tss/coursesToFile.ts <term>')
    process.exit(1)
  }
  const [, , term] = process.argv
  const allCourses = new Map(
    Object.entries(JSON.parse(await readFile('tss/courses.json', 'utf-8')))
  ) as AllCourses
  const resolvedDays: ResolvedDay[] = JSON.parse(
    await readFile('tss/resolvedDays.json', 'utf-8')
  )
  const scrapeTime = +(await readFile('tss/scrapeTime.txt', 'utf-8')).trim()
  for (const buildingsOnly of [false, true]) {
    await using out = await open(
      `classrooms-${term}${buildingsOnly ? '' : '-full'}.txt`,
      'w'
    )
    for (const chunk of coursesToFile(allCourses, resolvedDays, {
      scrapeTime,
      buildingsOnly
    })) {
      await out.write(chunk)
    }
  }
}
