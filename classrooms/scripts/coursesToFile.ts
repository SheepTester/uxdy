// deno run --allow-read classrooms/scripts/to-file.ts WI23 > classrooms/dist/classrooms-WI23.txt

import { writeAll } from 'std/streams/write_all.ts'
import {
  groupSections,
  Meeting
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

async function printMeeting (meeting: Meeting, days = true): Promise<void> {
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

function inPerson (meeting: Meeting): boolean {
  return meeting.location !== null && meeting.location.building !== 'RCLAS'
}

/**
 * When `buildingsOnly` is true, it'll only include relevant information for
 * showing classroom schedules:
 * - Remote and TBA meetings and courses are omitted.
 * -
 */
async function coursesToFile (
  result: ScrapedResult,
  buildingsOnly = false
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
      await print(String((+(meetings.length > 0) << 1) | +(exams.length > 0)))
      await print(group.code)
      if (!buildingsOnly) {
        await print(group.instructors.map(names => names.join(',')).join('\t'))
      }
      await print('\n')
      for (const meeting of group.sections) {
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
          await printMeeting(meeting)
        }
        await print('\n')
      }
      if (exams.length > 0) {
        for (const meeting of exams) {
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
    Deno.args[1] === 'abridged'
  )
}
