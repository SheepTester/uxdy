// deno run --allow-read classrooms/scripts/to-file.ts WI23 > classrooms/dist/classrooms-WI23.txt

import { writeAll } from 'std/streams/write_all.ts'
import {
  BaseMeeting,
  groupSections
} from '../../scheduleofclasses/group-sections.ts'
import { readCourses, ScrapedResult } from '../../scheduleofclasses/scrape.ts'

const encoder = new TextEncoder()
async function print (content: string) {
  await writeAll(Deno.stdout, encoder.encode(content))
}

const printTime = (minutes?: number) =>
  print(
    minutes === undefined
      ? 'TBA '
      : Math.floor(minutes / 60)
          .toString()
          .padStart(2, '0') + (minutes % 60).toString().padStart(2, '0')
  )

async function printMeeting (meeting: BaseMeeting, days = true): Promise<void> {
  await print((meeting.location?.building ?? 'TBA').padEnd(5, ' '))
  if (days) {
    await print((meeting.time?.days.join('') ?? 'TBA').padEnd(5, ' '))
  }
  await print(meeting.type)
  // Remove hyphens from Mandeville basement room numbers because they're
  // inconsistent
  await print(
    (meeting.location?.room.replace(/^B-/, 'B') ?? 'TBA').padEnd(5, ' ')
  )
  await printTime(meeting.time?.start)
  await printTime(meeting.time?.end)
}

function inPerson (meeting: BaseMeeting): boolean {
  return (
    meeting.time !== null &&
    meeting.location !== null &&
    meeting.location.building !== 'RCLAS'
  )
}

/**
 * When `buildingsOnly` is true, it'll only include relevant information for
 * showing classroom schedules:
 * - Remote and TBA meetings and courses are omitted.
 * -
 */
async function coursesToFile (
  result: ScrapedResult,
  buildingsOnly = false,
  includeDateRange = false
): Promise<void> {
  await print(`V3${result.scrapeTime}\n`)
  for await (const course of Object.values(groupSections(result))) {
    if (
      buildingsOnly &&
      course.groups.every(group =>
        [...group.sections, ...group.meetings, ...group.exams].every(
          meeting => !inPerson(meeting)
        )
      )
    ) {
      continue
    }
    const [subject, number] = course.code.split(' ')
    await print(subject.padEnd(4, ' '))
    await print(number.padEnd(5, ' '))
    if (!buildingsOnly) {
      await print(course.title)
      if (course.catalog) {
        await print('\t')
        await print(course.catalog)
      }
    }
    await print('\n')
    for (const group of course.groups) {
      if (
        buildingsOnly &&
        [...group.sections, ...group.meetings, ...group.exams].every(
          meeting => !inPerson(meeting)
        )
      ) {
        continue
      }
      const meetings = buildingsOnly
        ? group.meetings.filter(inPerson)
        : group.meetings
      const exams = buildingsOnly ? group.exams.filter(inPerson) : group.exams
      await print(
        meetings.length > 0
          ? exams.length > 0
            ? ':'
            : '.'
          : exams.length > 0
          ? "'"
          : ' '
      )
      await print(group.code)
      if (includeDateRange) {
        if (!group.dateRange) {
          throw new TypeError(
            `Summer session ${course.code} ${group.code} does not have date range.`
          )
        }
        await print(group.dateRange[0].toString().replaceAll('-', ''))
        await print(group.dateRange[1].toString().replaceAll('-', ''))
      }
      if (!buildingsOnly) {
        await print(group.instructors.map(names => names.join(',')).join('\t'))
      }
      await print('\n')
      for (const meeting of group.sections) {
        if (buildingsOnly && !inPerson(meeting)) {
          continue
        }
        await print(
          meeting.capacity === Infinity
            ? '9999'
            : meeting.capacity.toString().padStart(4, '0')
        )
        await printMeeting(meeting)
        if (meeting.code !== group.code || group.sections.length > 1) {
          await print(meeting.code)
        }
      }
      await print('\n')
      if (meetings.length > 0) {
        for (const meeting of meetings) {
          if (buildingsOnly && !inPerson(meeting)) {
            continue
          }
          await printMeeting(meeting)
          if (!buildingsOnly && meeting.code !== group.code) {
            await print(meeting.code)
          }
        }
        await print('\n')
      }
      if (exams.length > 0) {
        for (const meeting of exams) {
          if (buildingsOnly && !inPerson(meeting)) {
            continue
          }
          await print(meeting.date.toString().replaceAll('-', ''))
          await printMeeting(meeting, false)
        }
        await print('\n')
      }
    }
  }
}

if (import.meta.main) {
  if (!Deno.args[0]) {
    console.error('Usage: deno run --allow-read classrooms/to-file.ts [term]')
    Deno.exit(1)
  }
  await coursesToFile(
    await readCourses(`./scheduleofclasses/terms/${Deno.args[0]}.json`),
    Deno.args[1] === 'abridged',
    Deno.args[0].startsWith('S3')
  )
}
