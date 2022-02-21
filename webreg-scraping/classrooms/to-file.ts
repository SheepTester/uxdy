// deno run --allow-read classrooms/to-file.ts > classrooms/dist/classrooms.txt

import { writeAll } from 'https://deno.land/std@0.126.0/streams/conversion.ts'
import { Scraper } from '../scrape.ts'

const encoder = new TextEncoder()
async function print (content: string) {
  await writeAll(Deno.stdout, encoder.encode(content))
}

const scraper = new Scraper('WI22', { cachePath: 'cache-wi22' })

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

      await print(group.instructionType)
      await print(group.time.location.building.padEnd(5, ' '))
      await print(group.time.location.room.padEnd(5, ' '))
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
