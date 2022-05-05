// deno run --allow-read classrooms/to-file.ts WI22

import { writeAll } from 'https://deno.land/std@0.126.0/streams/conversion.ts'
import { Scraper } from '../scrape.ts'

const encoder = new TextEncoder()
async function print (content: string) {
  await writeAll(Deno.stdout, encoder.encode(content))
}

if (!Deno.args[0]) {
  console.error(
    'Please specify where to get the cached course data from. Thanks'
  )
  Deno.exit(1)
}

const scraper = new Scraper("shouldn't matter", { cachePath: Deno.args[0] })

for await (const course of scraper.allCourses()) {
  let coursePrinted = false
  for (const group of course.groups) {
    if (
      !group.isExam() &&
      group.time?.location &&
      group.time.location.building !== 'RCLAS' &&
      // Unsure what an empty building/room number means
      group.time.location.building !== ''
    ) {
      if (!coursePrinted) {
        await print(course.subject.padEnd(4, ' '))
        await print(course.course.padEnd(5, ' '))
        coursePrinted = true
      }

      await print(
        group.capacity === Infinity
          ? '9999'
          : group.capacity.toString().padStart(4, '0')
      )
      await print(group.time.location.building.padEnd(5, ' '))
      // Remove hyphens from Mandeville basement room numbers because they're
      // inconsistent
      await print(group.time.location.room.replace(/^B-/, 'B').padEnd(5, ' '))
      await print(group.time.days.join('').padEnd(5, ' '))
      await print(group.time.start.hour.toString().padStart(2, '0'))
      await print(group.time.start.minute.toString().padStart(2, '0'))
      await print(group.time.end.hour.toString().padStart(2, '0'))
      await print(group.time.end.minute.toString().padStart(2, '0'))
    }
  }
  if (coursePrinted) {
    await print('\n')
  }
}
