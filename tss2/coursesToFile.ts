/**
 * @file
 * Same format as classrooms/scripts/coursesToFile.ts
 *
 * usage: node tss2/coursesToFile.ts <term>
 */

import { createWriteStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import type {
  SimplifiedSection,
  SimplifiedSectionMeeting,
  SimplifiedSectionMeetingBase,
  SimplifiedSectionMeetingClass,
  SimplifiedSectionMeetingExam
} from './api.ts'

function isInPerson (meeting: SimplifiedSectionMeeting): boolean {
  return meeting.location !== null
}

function * printTime (minutes: number): Generator<string> {
  yield Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')
  yield (minutes % 60).toString().padStart(2, '0')
}

const types: Record<
  SimplifiedSection['instructionType'] | SimplifiedSectionMeetingExam['kind'],
  string
> = {
  se: 'SE',
  lecture: 'LE',
  lab: 'LA',
  discussion: 'DI',
  pr: 'PR',
  st: 'ST',
  tu: 'TU',
  fw: 'FW',
  in: 'IN',
  it: 'IT',
  cl: 'CL',
  co: 'CO',
  ot: 'OT',
  final: 'FI',
  midterm: 'MI',
  other: 'OT'
}
const DAYS = 'UMTWRFS'
function * printMeeting (
  meeting: SimplifiedSectionMeetingBase,
  instructionType:
    SimplifiedSection['instructionType'] | SimplifiedSectionMeetingExam['kind']
): Generator<string> {
  const [building, room] = (meeting.location?.room ?? 'TBA TBA').split(' ')
  yield building.padEnd(5)
  // TODO: merge days. also need to disable this for exams
  yield [meeting.day]
    .map(day => DAYS.indexOf(day))
    .sort()
    .join('')
    // This is probably technically incorrect, ISIS supports up to all 7 days,
    // but whatever
    .padEnd(5)
  yield types[instructionType]
  yield room.replace(/^B-/, 'B').padEnd(5)
  yield * printTime(meeting.start)
  yield * printTime(meeting.end)
}

export type CourseToFileOptions = {
  buildingsOnly: boolean
}
export function * coursesToFile (
  sections: SimplifiedSection[],
  { buildingsOnly }: CourseToFileOptions
): Generator<string> {
  const scrapeTime = sections.reduce(
    (cum, curr) =>
      curr.refreshDate !== null && curr.refreshDate > cum
        ? curr.refreshDate
        : cum,
    0
  )
  console.error(
    `debug: using scrape time ${new Date(scrapeTime).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`
  )

  yield `V4${scrapeTime}\n`
  for (const [, courseSections] of Map.groupBy(
    sections,
    ({ subject, number }) => `${subject}-${number}`
  )
    .entries()
    .toArray()
    .sort((a, b) => a[0].localeCompare(b[0]))) {
    const groups = Map.groupBy(
      courseSections.toSorted(
        (a, b) =>
          a.sectionCode.localeCompare(b.sectionCode) ||
          a.sectionId.localeCompare(b.sectionId)
      ),
      // Pretty sure this is 1-indexed
      section => +section.sectionCode.split('-')[0]
    )
      .entries()
      .map(([groupCode, group]) => ({
        groupCode,
        meetings: group
          .values()
          .flatMap(
            (
              section
            ): Iterable<{
              meeting: SimplifiedSectionMeetingClass | null
              section: SimplifiedSection
            }> =>
              section.sectionId.startsWith('EL') && !buildingsOnly
                ? [{ meeting: null, section }]
                : section.meetings
                  .values()
                  .filter(meeting => meeting.kind === 'class')
                  .filter(meeting => !buildingsOnly || isInPerson(meeting))
                  .map(meeting => ({ meeting, section }))
          )
          .toArray(),
        exams: group
          .values()
          .flatMap(section => section.meetings)
          .filter(meeting => meeting.kind !== 'class')
          .filter(exam => !buildingsOnly || isInPerson(exam))
          .toArray(),
        instructors: new Set(
          group
            .values()
            .flatMap(section =>
              section.instructors === ''
                ? []
                : // Note: may need to update if they ever add support for
                // multiple instructors
                section.instructors.split(', ')
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

    const [{ subject, number, courseTitle }] = courseSections
    yield subject.padEnd(4)
    // Remove leading zeroes because UI search isn't designed for them
    yield number.replace(/^0+/, '').padEnd(5)
    if (!buildingsOnly) {
      yield courseTitle
    }
    yield '\n'

    const cantUseLetterCode =
      groups.reduce((cum, curr) => Math.max(cum, curr.groupCode), 0) > 26
    const cantUseNumberCode = groups
      .values()
      .some(group => group.meetings.length > 1)
    if (cantUseLetterCode && cantUseNumberCode) {
      console.error(groups)
      throw new Error(
        `Can't use letter nor number code for ${subject}-${number}`
      )
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

      for (const { meeting, section } of meetings) {
        yield section.capacity.toString().padStart(4, '0')

        if (meeting === null) {
          yield 'TBA  ' // building
          yield 'TBA  ' // days
          yield types[section.instructionType]
          yield 'TBA  ' // room
          yield 'TBA ' // start
          yield 'TBA ' // end
        } else {
          printMeeting(meeting, section.instructionType)
        }

        yield prefix
        if (useLetterCode) {
          yield section.sectionCode.split('-')[1].slice(-2)
        }
      }
      yield '\n'

      if (exams.length > 0) {
        for (const exam of exams) {
          const specificDate = new Date(exam.specificDate)
          yield `${specificDate.getUTCFullYear().toString().padStart(4, '0')}${(
            specificDate.getUTCMonth() + 1
          )
            .toString()
            .padStart(2, '0')}${specificDate
            .getUTCDate()
            .toString()
            .padStart(2, '0')}`
          yield * printMeeting(exam, exam.kind)
        }
        yield '\n'
      }
    }
  }
}

if (import.meta.main) {
  if (process.argv.length !== 3) {
    console.error('usage: node tss2/coursesToFile.ts <term>')
    process.exit(1)
  }
  const [, , term] = process.argv
  const sections = JSON.parse(
    await readFile(`tss2/sections-${term}.json`, 'utf-8')
  )
  await Promise.all(
    [false, true].map(async buildingsOnly => {
      await pipeline(
        coursesToFile(sections, { buildingsOnly }),
        createWriteStream(
          `classrooms-${term}${buildingsOnly ? '' : '-full'}.txt`
        )
      )
    })
  )
}
