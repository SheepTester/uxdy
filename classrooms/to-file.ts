// deno run --allow-read classrooms/to-file.ts WI23 > classrooms/dist/classrooms-WI23.txt

import { writeAll } from 'std/streams/write_all.ts'
import { groupSections, Meeting } from '../scheduleofclasses/group-sections.ts'
import { readCourses } from '../scheduleofclasses/scrape.ts'

const encoder = new TextEncoder()
async function print (content: string) {
  await writeAll(Deno.stdout, encoder.encode(content))
}

if (!Deno.args[0]) {
  console.error('Usage: deno run --allow-read classrooms/to-file.ts [term]')
  Deno.exit(1)
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
await print('V2\n')
for await (const course of Object.values(
  groupSections(
    await readCourses(`../scheduleofclasses/terms/${Deno.args[0]}.json`)
  )
)) {
  const [subject, number] = course.code.split(' ')
  await print(subject.padEnd(4, ' '))
  await print(number.padEnd(5, ' '))
  await print(course.title)
  await print('\n')
  for (const group of course.groups) {
    await print('\t')
    await print(
      String((+(group.meetings.length > 0) << 1) | +(group.exams.length > 0))
    )
    await print(group.code)
    await print(group.instructors.map(names => names.join(',')).join('\t'))
    await print('\n')
    await print('\t')
    for (const meeting of group.sections) {
      await print(
        meeting.capacity === Infinity
          ? '9999'
          : meeting.capacity.toString().padStart(4, '0')
      )
      await print(meeting.code)
      await printMeeting(meeting)
    }
    await print('\n')
    if (group.meetings.length > 0) {
      await print('\t')
      for (const meeting of group.meetings) {
        await printMeeting(meeting)
      }
      await print('\n')
    }
    if (group.exams.length > 0) {
      await print('\t')
      for (const meeting of group.exams) {
        await printMeeting(meeting, false)
        await print(meeting.date.getUTCFullYear().toString().padStart(4, '0'))
        await print(
          (meeting.date.getUTCMonth() + 1).toString().padStart(2, '0')
        )
        await print(meeting.date.getUTCDate().toString().padStart(2, '0'))
      }
      await print('\n')
    }
  }
}
