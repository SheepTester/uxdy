// deno run --allow-read classrooms/to-file.ts WI22 > classrooms/dist/classrooms-wi22.txt

import { writeAll } from 'https://deno.land/std@0.126.0/streams/conversion.ts'
import {
  groupSections,
  Meeting,
  Section
} from '../../scheduleofclasses/group-sections.ts'
import { readCourses } from '../../scheduleofclasses/scrape.ts'

const encoder = new TextEncoder()
async function print (content: string) {
  await writeAll(Deno.stdout, encoder.encode(content))
}

if (!Deno.args[0]) {
  console.error('Usage: deno run --allow-read classrooms/to-file.ts [term]')
  Deno.exit(1)
}

const printTime = (minutes: number) =>
  Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0') + (minutes % 60).toString().padStart(2, '0')
for await (const course of Object.values(
  groupSections(
    await readCourses(`../scheduleofclasses/terms/${Deno.args[0]}.json`)
  )
)) {
  let coursePrinted = false
  for (const group of course.groups) {
    const groupCapacity = group.sections.reduce(
      (cum, curr) => cum + curr.capacity,
      0
    )
    const meetings: (Section | Meeting)[] = [
      ...group.sections,
      ...group.meetings
    ]
    for (const meeting of meetings) {
      if (
        meeting.time &&
        meeting.location &&
        meeting.location.building !== 'RCLAS'
      ) {
        if (!coursePrinted) {
          const [subject, number] = course.code.split(' ')
          await print(subject.padEnd(4, ' '))
          await print(number.padEnd(5, ' '))
          coursePrinted = true
        }

        const capacity =
          'capacity' in meeting ? meeting.capacity : groupCapacity
        await print(
          capacity === Infinity ? '9999' : capacity.toString().padStart(4, '0')
        )
        await print(meeting.location.building.padEnd(5, ' '))
        // Remove hyphens from Mandeville basement room numbers because they're
        // inconsistent
        await print(meeting.location.room.replace(/^B-/, 'B').padEnd(5, ' '))
        await print(meeting.time.days.join('').padEnd(5, ' '))
        await print(printTime(meeting.time.start))
        await print(printTime(meeting.time.end))
      }
    }
  }
  if (coursePrinted) {
    await print('\n')
  }
}
